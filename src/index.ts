import api from './middle/serve';
import { Tags, generateOpenAPISchemas } from './resources/openapi';
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
import {
  on,
  emit,
  remove,
  EventCallback,
  EventKey,
  onAction,
  emitAction,
  removeAction
} from './resources/events';
import { AdminData, OpenAPI, Paths } from './resources/openapi/openapiTypes';
import { Sequelize } from 'sequelize';
import { promisify } from 'util';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import builderOpenapi from './routes/openapi';
import { SchemaModelsBuilder } from './resources/sequelize/builder';
import {
  FastifyInstance,
  FastifyListenOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify';
import {
  MakeHandlers,
  ResourceTypes,
  getResourceName
} from './decorators/handlers';
import { MakeRouters } from './decorators/routes';
import fs from 'fs';

export function getAppVersion(): string {
  try {
    const packageJson = fs.readFileSync(
      `${process.cwd()}/package.json`,
      'utf8'
    );
    const packageObject = JSON.parse(packageJson);

    return packageObject.version;
  } catch {
    return 'undefined';
  }
}

export interface LoadSpecOptions {
  resources: Resources;
  tags?: Tags;
  routes?: Routes[];
  handlers?: HandlerMethods;
}

export interface FastAPIOptions {
  routes?: RoutesType[];
  schema?: Schema | SequelizeResources[] | SchemaModelsBuilder;
  tags?: Tags;
  handlers?: HandlersType[];
  resources?: Resources;
  sequelize?: Sequelize;
  cors?: Cors;
  forceCreateTables?: boolean;
  listen?: FastifyListenOptions;
  info?: DocInfo;
  servers?: ServerObject[];
  autoLoadSchema?: boolean;
  autoLoadRoutes?: boolean;
}

export interface Cors {
  origin: string;
}

export interface Models {
  [key: string]: typeof SequelizeModel;
}

export type RoutesType =
  | Routes
  | RoutesBuilder
  | PathBuilder
  | typeof MakeRouters
  | MakeRouters;

export type HandlersType = Handlers | typeof MakeHandlers | MakeHandlers;

export class FastAPI {
  info: DocInfo = {
    title: 'FastAPI',
    description: 'FastAPI',
    version: getAppVersion()
  };
  servers: ServerObject[] = [];
  listenConfig: FastifyListenOptions = {
    port: 3000,
    host: '0.0.0.0'
  };
  rawRoutes: RoutesType[] = [];
  routes: Routes[] = [];
  tags: Tags = {
    create: ['Creates'],
    read: ['Reads'],
    update: ['Updates'],
    delete: ['Deletes'],
    list: ['Lists']
  };
  rawHandlers: HandlersType[] = [];
  handlers: Handlers = {};
  private schema?: Schema | SequelizeResources[] | SchemaModelsBuilder;
  resources: Resources = {};
  models: Models = {};
  cors: Cors = {
    origin: '*'
  };
  forceCreateTables = false;
  api: FastifyInstance;
  private listenFn: (options: FastifyListenOptions) => Promise<void>;
  sequelize?: Sequelize;
  openAPISpec?: OpenAPI;
  private afterLoad: MakeHandlers | MakeRouters[] = [];
  autoLoadSchema = true;
  autoLoadRoutes = true;

  constructor(props?: FastAPIOptions) {
    if (props) {
      if (props.schema !== undefined) {
        this.schema = props.schema;
      }

      if (props.tags !== undefined) {
        this.tags = props.tags;
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

      if (props.autoLoadSchema !== undefined) {
        this.autoLoadSchema = props.autoLoadSchema;
      }

      if (props.autoLoadRoutes !== undefined) {
        this.autoLoadSchema = props.autoLoadRoutes;
      }

      if (props.routes !== undefined) {
        this.rawRoutes = props.routes;
      }

      if (props.handlers !== undefined) {
        this.rawHandlers = props.handlers;
      }
    }

    this.api = api();
    this.listenFn = promisify(this.api.listen.bind(this.api));

    if (this.autoLoadSchema && this.schema !== undefined) {
      this.loadSchema();

      if (this.autoLoadRoutes) {
        this.loadRawRoutes();
        this.loadRoutes();
      }
    }

    return this;
  }

  setSequelize(sequelize: Sequelize): void {
    this.sequelize = sequelize;
  }

  setSchema(schema: Schema | SequelizeResources[] | SchemaModelsBuilder): void {
    this.schema = schema;
  }

  private loadRawRoutes(): void {
    for (const route of this.rawRoutes) {
      this.addRoutes(route);
    }
  }

  private loadRawHandlers(): void {
    for (const handlers of this.rawHandlers) {
      this.addHandlers(handlers);
    }
  }

  loadSchema(
    schema?: Schema | SequelizeResources[] | SchemaModelsBuilder
  ): void {
    if (schema === undefined) {
      schema = this.schema;
    } else {
      this.schema = schema;
    }

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
    let schemasPaths: Paths = {};

    const resources = this.resources;
    const tags = this.tags;
    const handlers = this.handlers;
    const adminsData: AdminData = {
      resources: {}
    };

    const createRoutes = new CreateRoutes(this.api);

    for (const key in this.resources) {
      const resource = resources[key];
      const openapiSchemas = generateOpenAPISchemas(resource, tags);
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

      schemasPaths = { ...schemasPaths, ...paths } as Paths;
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
      ...schemasPaths,
      ...healthPaths,
      ...paths
    };

    const openapi = builderOpenapi({
      paths: docPaths,
      info: this.info,
      servers: this.servers,
      admin: adminsData
    });

    this.openAPISpec = openapi.spec;

    createRoutes.createRoutes(openapi.routes);

    createRoutes.api.setErrorHandler(function (
      error: any,
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      reply.send(error);
    });
  }

  afterLoadExecute() {
    if (this.afterLoad) {
      this.afterLoad.forEach((builder: MakeHandlers | MakeRouters) => {
        builder.onLoad(this);
      });
    }
  }

  async listen() {
    await this.listenFn(this.listenConfig);
    this.afterLoadExecute();
  }

  getResource(resourceName: ResourceTypes): Resource {
    return this.resources[getResourceName(resourceName)];
  }

  addRoutes(routes: RoutesType): void {
    if (routes instanceof RoutesBuilder || routes instanceof PathBuilder) {
      this.routes.push(routes.build());
    } else if (routes instanceof MakeRouters) {
      this.routes.push(routes.getRoutes());
      this.afterLoad?.push(routes);
    } else if (typeof routes === 'function') {
      const builder = new routes();
      this.routes.push(builder.getRoutes());
      this.afterLoad?.push(builder);
    } else {
      this.routes.push(routes);
    }
  }

  addHandlers(handlers: HandlersType): void {
    if (handlers instanceof MakeHandlers) {
      this.handlers = { ...this.handlers, ...handlers.getHandlers() };
      this.afterLoad?.push(handlers);
    } else if (typeof handlers === 'function') {
      const builder = new handlers();
      this.handlers = { ...this.handlers, ...builder.getHandlers() };
      this.afterLoad?.push(builder);
    } else {
      this.handlers = { ...this.handlers, ...handlers };
    }
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
  on<T>(modelName: EventKey, action: T, callback: EventCallback): FastAPI {
    onAction(modelName, action, callback);
    return this;
  }

  emit<T>(modelName: EventKey, action: T, err: any, data: any): FastAPI {
    emitAction(modelName, action, err, data);
    return this;
  }

  removeListener<T>(modelName: EventKey, action: T): FastAPI {
    removeAction(modelName, action);
    return this;
  }

  getOpenAPISpec(): OpenAPI {
    if (!this.openAPISpec) {
      throw new Error('OpenAPI spec not found');
    }

    return this.openAPISpec;
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
  HandlerMethods,
  HandlerMethodType,
  Handlers
};
export { HandlerType } from './resources/routes/routes';

export { FastifyReply as Reply, FastifyRequest as Request };
export { OpenAPI } from './resources/openapi/openapiTypes';

export {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  MakeRouters
} from './decorators/routes';
export {
  Create,
  GetAll,
  GetOne,
  Update,
  Remove,
  MakeHandlers
} from './decorators/handlers';

export const events = {
  on,
  emit,
  remove,
  onAction,
  emitAction,
  removeAction
};
