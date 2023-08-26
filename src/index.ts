import api from './middle/serve';
import {
  FastifyRequest,
  FastifyReply,
  FastifyListenOptions,
  FastifyInstance
} from 'fastify';
import { Tags, generateOpenapiSchemas } from './resources/openapi';
import {
  HandlerMethods,
  Methods,
  PathBuilder,
  Route,
  Routes,
  RoutesBuilder,
  CreateRoutes,
  routesToPaths,
  Handlers,
  HandlerMethodType
} from './resources/routes';
import {
  Resource,
  Resources,
  Schema,
  SequelizeModel,
  generateResourcesFromJSON
} from './resources/sequelize';
import healthRoute from './routes/health';
import { on, emit, remove, EventCallback } from './resources/events';
import { AdminData, OpenAPI, Paths } from './resources/openapi/openapiTypes';
import { Options, Sequelize, SyncOptions } from 'sequelize';
import { promisify } from 'util';
import log from './resources/log';
import * as fs from 'fs';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import builderOpenapi from './routes/openapi';
import { TableBuilder } from './resources/sequelize/builder';
import { HandlerBuilder, getResourceName } from './routes/builders';

// get package.json version
const version = require('../package.json').version;

export interface LoadSpecOptions {
  resources: Resources;
  tags?: Tags;
  routes?: Routes[];
  handlers?: HandlerMethods;
}

export interface DatabaseOptions extends Options {
  uri?: string;
}

export interface FastAPIOptions {
  routes?: Routes[];
  tags?: Tags;
  handlers?: Handlers;
  schema?: string | Schema;
  resources?: Resources;
  database?: DatabaseOptions;
  cors?: Cors;
  forceCreateTables?: boolean;
  listen?: FastifyListenOptions;
  info?: DocInfo;
  server?: ServerObject[];
}

export interface Cors {
  origin: string;
}

export interface Models {
  [key: string]: typeof SequelizeModel;
}

export class FastAPI {
  info: DocInfo = {
    title: 'FastAPI',
    description: 'FastAPI',
    version
  };
  servers: ServerObject[] = [];
  listenConfig: FastifyListenOptions = {
    port: 3000,
    host: '0.0.0.0'
  };
  routes: Routes[] = [];
  tags: Tags = {
    create: ['create'],
    read: ['read'],
    update: ['update'],
    delete: ['delete'],
    list: ['list']
  };
  handlers: Handlers = {};
  private schema?: string | Schema;
  resources: Resources = {};
  models: Models = {};
  database: DatabaseOptions = {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: undefined,
    sync: {
      force: false
    }
  };
  cors: Cors = {
    origin: '*'
  };
  forceCreateTables = false;
  api: FastifyInstance;
  private databaseLoaded = false;
  private listen: (options: FastifyListenOptions) => Promise<void>;
  sequelize?: Sequelize;
  openapiSpec?: OpenAPI;

  constructor(props?: FastAPIOptions) {
    if (props) {
      if (props.schema !== undefined) {
        this.schema = props.schema;
      }

      if (props.routes !== undefined) {
        this.routes = props.routes;
      }

      if (props.handlers !== undefined) {
        this.handlers = props.handlers;
      }

      if (props.tags !== undefined) {
        this.tags = props.tags;
      }

      if (props.database !== undefined) {
        this.database = { ...this.database, ...props.database };
      }

      if (props.cors !== undefined) {
        this.cors = props.cors;
      }

      if (props.forceCreateTables) {
        this.forceCreateTables = props.forceCreateTables;
      }

      if (props.listen !== undefined) {
        this.listenConfig = props.listen;
      }

      if (props.info !== undefined) {
        this.info = props.info;
      }

      if (props.server !== undefined) {
        this.servers = props.server;
      } else {
        this.servers = [
          {
            url: `http://localhost:${this.listenConfig.port}`,
            description: 'Local server'
          }
        ];
      }
    }

    this.api = api();
    this.listen = promisify(this.api.listen.bind(this.api));

    return this;
  }

  private loadDatabaseInstance() {
    if (this.databaseLoaded) return;

    const { uri, ...database } = this.database;

    if (uri) {
      this.sequelize = new Sequelize(uri, database);
    } else {
      this.sequelize = new Sequelize(this.database);
    }

    this.databaseLoaded = true;
  }

  setDatabaseInstance(sequelize: Sequelize): void {
    this.sequelize = sequelize;
    this.databaseLoaded = true;
  }

  setSchema(schema: string | Schema): void {
    this.schema = schema;
  }

  loadSchema(schema?: string | Schema): void {
    this.loadDatabaseInstance();

    if (schema === undefined) {
      schema = this.schema;
    }

    if (schema) {
      const schemaJson =
        typeof schema === 'string'
          ? JSON.parse(fs.readFileSync(schema, 'utf8'))
          : schema;

      this.resources = generateResourcesFromJSON(
        schemaJson,
        this.sequelize as Sequelize
      );

      for (const key in this.resources) {
        const resource = this.resources[key];
        this.models[modelName(resource.name)] = resource.model;
      }
    } else {
      throw new Error('Schema not found');
    }
  }

  loadRoutes(): void {
    let shemasPaths: Paths = {};

    const resources = this.resources;
    const tags = this.tags;
    const handlers = this.handlers;
    const adminsData: AdminData = {
      resources: {}
    };

    const createRoutes = new CreateRoutes(this.api);
    for (const key in this.resources) {
      const resource = resources[key];
      const openapiSchemas = generateOpenapiSchemas(resource, tags);
      const paths = openapiSchemas.paths as Paths;
      const adminData = openapiSchemas['x-admin'] as AdminData;

      createRoutes.createRouteResource({
        paths,
        resource,
        handlers,
        adminData
      });

      adminsData.resources = {
        ...adminsData.resources,
        ...adminData.resources
      };

      shemasPaths = { ...shemasPaths, ...paths } as Paths;
    }

    let paths = {} as Paths;

    this.routes.forEach((route) => {
      createRoutes.createRoutes({ ...route });
      paths = { ...paths, ...routesToPaths(route) };
    });

    const health = healthRoute(this.sequelize as Sequelize);

    createRoutes.createRoutes(health);

    const healthPaths = routesToPaths(health);

    const docPaths = {
      ...shemasPaths,
      ...healthPaths,
      ...paths
    };

    const openapi = builderOpenapi({
      paths: docPaths,
      info: this.info,
      servers: this.servers,
      admin: adminsData
    });

    this.openapiSpec = openapi.spec;

    createRoutes.createRoutes(openapi.routes);

    createRoutes.api.setErrorHandler(function (
      error: any,
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      reply.send(error);
    });
  }

  loadAll() {
    this.loadSchema();
    this.loadRoutes();
  }

  setDatabase(database: Options): FastAPI {
    this.database = { ...this.database, ...database };
    return this;
  }

  async connect(): Promise<void> {
    await this.testDatabaseConnection();
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    try {
      await this.sequelize?.sync(this.database.sync);
      log.info('All tables created.');
    } catch (error) {
      log.error('Error creating tables:', error);
      await this.sequelize?.close();
    }
  }

  async testDatabaseConnection(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.authenticate();
    } else {
      throw new Error('Database connection not established');
    }
  }

  async start(): Promise<void> {
    this.loadAll();
    await this.connect();
    await this.listen(this.listenConfig);
  }

  //Resources
  getResource(resourceName: string | TableBuilder): Resource {
    return this.resources[getResourceName(resourceName)];
  }

  // Routes
  addRoutes(routes: Routes | RoutesBuilder | PathBuilder): void {
    if (routes instanceof RoutesBuilder || routes instanceof PathBuilder) {
      routes = routes.build();
    }

    this.routes.push(routes);
  }

  addHandlers(handlers: Handlers | typeof HandlerBuilder): void {
    if (typeof handlers === 'function') { 
      const builder = new handlers();
      handlers = builder.getHandlers();
    }

    this.handlers = { ...this.handlers, ...handlers };
  }

  path(path: string, options: Methods): FastAPI {
    this.addRoutes({
      [path]: options
    });

    return this;
  }

  get(path: string, options: Route): FastAPI {
    return this.path(path, {
      get: options
    });
  }

  post(path: string, options: Route): FastAPI {
    return this.path(path, {
      post: options
    });
  }

  put(path: string, options: Route): FastAPI {
    return this.path(path, {
      put: options
    });
  }

  delete(path: string, options: Route): FastAPI {
    return this.path(path, {
      delete: options
    });
  }

  patch(path: string, options: Route): FastAPI {
    return this.path(path, {
      patch: options
    });
  }

  // Events
  on(modelName: string, action: string, callback: EventCallback): FastAPI {
    on(modelName, action, callback);
    return this;
  }

  emit(modelName: string, action: string, err: any, data: any): FastAPI {
    emit(modelName, action, err, data);
    return this;
  }

  removeListener(modelName: string, action: string): FastAPI {
    remove(modelName, action);
    return this;
  }
}

export { PathBuilder, RoutesBuilder } from './resources/routes';
export { makeResponses } from './resources/openapi/responses';
export {
  SchemaBuilder,
  AutoColumn,
  TableBuilder
} from './resources/sequelize/builder';
export { ColumnType } from './resources/sequelize';
export { SequelizeModel as Model, Tags, log, HandlerMethods, HandlerMethodType, Handlers };
export { FastifyReply as Reply, FastifyRequest as Request };
export { DataTypes } from 'sequelize';

export function modelName(text: string): string {
  const name = text.charAt(0).toUpperCase();

  // se terminar com s, remove a ultima letra
  if (text[text.length - 1] === 's') {
    return name + text.slice(1, -1);
  }

  return name + text.slice(1);
}
