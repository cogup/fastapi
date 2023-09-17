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
  SequelizeResources,
  generateResourcesFromJSON,
  generateResourcesFromSequelizeModels
} from './resources/sequelize';
import healthRoute from './routes/health';
import { on, emit, remove, EventCallback } from './resources/events';
import { AdminData, OpenAPI, Paths } from './resources/openapi/openapiTypes';
import { Options, Sequelize } from 'sequelize';
import { promisify } from 'util';
import log from './resources/log';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import builderOpenapi from './routes/openapi';
import {
  SchemaModelsBuilder,
  TableBuilder
} from './resources/sequelize/builder';
import { MakeHandlers, MakeRouters, getResourceName } from './routes/makes';

// get package.json version
const rootPath = process.cwd();
const packagePath = `${rootPath}/package.json`;
const version = require(packagePath).version;

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
  schema?: Schema | SequelizeResources[] | SchemaModelsBuilder;
  resources?: Resources;
  database?: DatabaseOptions;
  sequelize?: Sequelize;
  cors?: Cors;
  forceCreateTables?: boolean;
  listen?: FastifyListenOptions;
  info?: DocInfo;
  servers?: ServerObject[];
}

export interface Cors {
  origin: string;
}

export interface Models {
  [key: string]: typeof SequelizeModel;
}

interface LoadedResources {
  schemas: boolean;
  routes: boolean;
  database: boolean;
  api: boolean;
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
    create: ['Creates'],
    read: ['Reads'],
    update: ['Updates'],
    delete: ['Deletes'],
    list: ['Lists']
  };
  handlers: Handlers = {};
  private schema?: Schema | SequelizeResources[] | SchemaModelsBuilder;
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
  private listenFn: (options: FastifyListenOptions) => Promise<void>;
  sequelize?: Sequelize;
  openapiSpec?: OpenAPI;
  private afterLoad: MakeHandlers | MakeRouters[] = [];
  private loadedResources: LoadedResources;

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

      if (props.servers !== undefined) {
        this.servers = props.servers;
      } else {
        this.servers = [
          {
            url: `http://localhost:${this.listenConfig.port}`,
            description: 'Local server'
          }
        ];
      }

      if (props.sequelize !== undefined) {
        this.sequelize = props.sequelize;
      }
    }

    this.api = api();
    this.listenFn = promisify(this.api.listen.bind(this.api));

    this.loadedResources = {
      schemas: false,
      routes: false,
      database: this.sequelize !== undefined,
      api: false
    };

    return this;
  }

  private loadDatabaseInstance() {
    if (this.loadedResources.database) return;

    const { uri, ...database } = this.database;

    if (uri) {
      this.sequelize = new Sequelize(uri, database);
    } else {
      this.sequelize = new Sequelize(this.database);
    }

    this.loadedResources.database = true;
  }

  setDatabaseInstance(sequelize: Sequelize): void {
    this.sequelize = sequelize;
    this.loadedResources.database = true;
  }

  setSchema(schema: Schema | SequelizeResources[] | SchemaModelsBuilder): void {
    this.schema = schema;
  }

  loadSchema(
    schema?: Schema | SequelizeResources[] | SchemaModelsBuilder
  ): void {
    if (this.loadedResources.schemas) return;

    this.loadDatabaseInstance();

    if (schema === undefined) {
      schema = this.schema;
    } else {
      this.schema = schema;
    }

    // schame is SchemaModelsBuilder

    // schema is Schema interface
    if (schema instanceof Array || schema instanceof SchemaModelsBuilder) {
      const resources = generateResourcesFromSequelizeModels(schema);

      this.resources = resources;

      for (const key in resources) {
        const resource = resources[key];
        const modelName =
          resource.model.name.charAt(0).toUpperCase() +
          resource.model.name.slice(1);
        this.models[modelName] = resource.model;
      }
    } else if (schema instanceof Object) {
      const schemaJson = schema;

      this.resources = generateResourcesFromJSON(
        schemaJson,
        this.sequelize as Sequelize
      );

      for (const key in this.resources) {
        const resource = this.resources[key];
        const modelName =
          resource.model.name.charAt(0).toUpperCase() +
          resource.model.name.slice(1);
        this.models[modelName] = resource.model;
      }
    } else {
      throw new Error('Schema not found');
    }
  }

  loadRoutes(): void {
    if (this.loadedResources.routes) return;

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

  loadResources() {
    this.loadSchema();
    this.loadRoutes();
  }

  setDatabase(database: Options): FastAPI {
    this.database = { ...this.database, ...database };
    return this;
  }

  async dbConnect(): Promise<void> {
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

  afterLoadExecute() {
    if (this.afterLoad) {
      this.afterLoad.forEach((builder: MakeHandlers | MakeRouters) => {
        builder.onLoad(this);
      });
    }
  }

  async listen() {
    if (this.loadedResources.api) return;

    await this.listenFn(this.listenConfig);
    this.afterLoadExecute();
  }

  async start(): Promise<void> {
    this.loadResources();
    await this.dbConnect();
    await this.listen();
  }

  //Resources
  getResource(resourceName: string | TableBuilder): Resource {
    return this.resources[getResourceName(resourceName)];
  }

  // Routes
  addRoutes(
    routes:
      | Routes
      | RoutesBuilder
      | PathBuilder
      | typeof MakeRouters
      | MakeRouters
  ): void {
    if (routes instanceof RoutesBuilder || routes instanceof PathBuilder) {
      routes = routes.build();
    } else if (routes instanceof MakeRouters) {
      routes = routes.getRoutes();
    } else if (typeof routes === 'function') {
      const builder = new routes();
      routes = builder.getRoutes();
      this.afterLoad?.push(builder);
    }

    this.routes.push(routes);
  }

  addHandlers(handlers: Handlers | typeof MakeHandlers): void {
    if (handlers instanceof MakeHandlers) {
      handlers = handlers.getHandlers();
    } else if (typeof handlers === 'function') {
      const builder = new handlers();
      handlers = builder.getHandlers();
      this.afterLoad?.push(builder);
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
  TableBuilder,
  SchemaModelsBuilder
} from './resources/sequelize/builder';
export { ResourceType } from './resources/sequelize';
export {
  Sequelize,
  SequelizeModel as Model,
  Tags,
  log,
  HandlerMethods,
  HandlerMethodType,
  Handlers
};
export { FastifyReply as Reply, FastifyRequest as Request };
export { DataTypes } from 'sequelize';
export * as Decorators from './routes/makes';
