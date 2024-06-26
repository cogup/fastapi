import api from './middle/serve';
import {
  generateOpenAPISchemas,
  insertIncludeOnOpenAPISchemas,
  Tags
} from './resources/openapi';
import {
  Controllers,
  CreateRoutes,
  HandlerMethods,
  HandlerMethodType,
  Handlers,
  Methods,
  PathBuilder,
  Route,
  RoutesBuilder,
  routesToPaths
} from './resources/controllers';
import {
  generateResourcesFromJSON,
  generateResourcesFromSequelizeModels,
  Resource,
  Resources,
  Schema,
  SequelizeModel,
  SequelizeResources
} from './resources/sequelize';
import {
  emit,
  emitAction,
  EventCallback,
  EventKey,
  on,
  onAction,
  remove,
  removeAction
} from './resources/events';
import { AdminData, OpenAPI, Paths } from './resources/openapi/openapiTypes';
import { Sequelize } from 'sequelize';
import { promisify } from 'util';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import builderOpenapi from './controllers/openapi';
import { SchemaModelsBuilder } from './resources/sequelize/builder';
import {
  FastifyInstance,
  FastifyListenOptions,
  FastifyReply,
  FastifyRequest
} from 'fastify';
import { getResourceName, HandlerResourceTypes } from './decorators/handlers';
import fs from 'fs';
import { Builder } from './decorators/builder';
import { BuilderInject, loadBuilderClasses } from './decorators/inject';
import HealthRoute from './controllers/health';
import { loadControllers } from './controllers/loader';

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
  routes?: Controllers[];
  handlers?: HandlerMethods;
}

export interface FastAPIOptions {
  routes?: RoutesType[];
  handlers?: HandlersType[];
  events?: EventsType[];
  builders?: (typeof Builder)[];
  schema?: Schema | SequelizeResources[] | SchemaModelsBuilder;
  tags?: Tags;
  resources?: Resources;
  sequelize?: Sequelize;
  cors?: Cors;
  forceCreateTables?: boolean;
  listen?: FastifyListenOptions;
  info?: DocInfo;
  servers?: ServerObject[];
  autoLoadSchema?: boolean;
  autoLoadRoutes?: boolean;
  autoLoadHandlers?: boolean;
  autoLoadEvents?: boolean;
  prefix?: string;
}

export interface Cors {
  origin: string;
}

export interface Models {
  [key: string]: typeof SequelizeModel;
}

export type RoutesType =
  | Controllers
  | RoutesBuilder
  | PathBuilder
  | typeof Builder
  | Builder
  | BuilderInject;
export type HandlersType = Handlers | typeof Builder | Builder | BuilderInject;
export type EventsType = typeof Builder | Builder | BuilderInject;

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
  private rawRoutes: RoutesType[] = [];
  controllers: Controllers[] = [];
  tags: Tags = {
    create: ['Creates'],
    read: ['Reads'],
    update: ['Updates'],
    delete: ['Deletes'],
    list: ['Lists']
  };
  private rawHandlers: HandlersType[] = [];
  private rawEvents: EventsType[] = [];
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
  private afterLoad: Builder[] = [];
  autoLoadSchema = true;
  autoLoadRoutes = true;
  autoLoadHandlers = true;
  autoLoadEvents = true;
  prefix = '/api';

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
        this.autoLoadRoutes = props.autoLoadRoutes;
      }

      if (props.autoLoadHandlers !== undefined) {
        this.autoLoadHandlers = props.autoLoadHandlers;
      }

      if (props.autoLoadEvents !== undefined) {
        this.autoLoadEvents = props.autoLoadEvents;
      }

      if (props.routes !== undefined) {
        this.rawRoutes = props.routes;
      }

      if (props.handlers !== undefined) {
        this.rawHandlers = props.handlers;
      }

      if (props.events !== undefined) {
        this.rawEvents = props.events;
      }

      if (props.builders) {
        this.rawEvents.push(...props.builders);
        this.rawHandlers.push(...props.builders);
        this.rawRoutes.push(...props.builders);
      }

      if (props.prefix) {
        this.prefix = props.prefix;
      }
    }

    this.api = api();
    this.listenFn = promisify(this.api.listen.bind(this.api));

    loadControllers(process.cwd()).forEach((controller) => {
      this.api.log.info(`Loading controller: ${controller}`);
    });

    const builderClasses = loadBuilderClasses();

    this.rawEvents.push(...builderClasses);
    this.rawHandlers.push(...builderClasses);
    this.rawRoutes.push(...builderClasses);

    if (this.autoLoadSchema && this.schema !== undefined) {
      this.loadSchema();

      if (this.autoLoadHandlers) {
        this.loadRawHandlers();
      }
    }

    if (this.autoLoadEvents) {
      this.loadRawEvents();
    }

    if (this.autoLoadRoutes) {
      this.loadRawRoutes();
      this.loadRoutes();
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

  private loadRawEvents(): void {
    for (const events of this.rawEvents) {
      this.addEvents(events);
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
      const openapiSchemas = generateOpenAPISchemas(
        resource,
        tags,
        this.prefix
      );
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

    schemasPaths = insertIncludeOnOpenAPISchemas(
      schemasPaths,
      resources,
      this.prefix
    );

    let paths = {} as Paths;

    this.controllers.forEach((route) => {
      createRoutes.createRoutes({ ...route });
      paths = { ...paths, ...routesToPaths(route) };
    });

    const health = new HealthRoute();
    const healthPaths = health.loadRoutes(this.prefix);

    const docPaths = {
      ...schemasPaths,
      ...healthPaths,
      ...paths
    };

    const openapi = builderOpenapi(
      {
        paths: docPaths,
        info: this.info,
        servers: this.servers,
        admin: adminsData
      },
      this.prefix
    );

    this.openAPISpec = openapi.spec;

    createRoutes.createRoutes(openapi.controllers);
    createRoutes.createRoutes(healthPaths);

    createRoutes.api.setErrorHandler(function (
      error: any,
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      reply.send(error);
    });

    this.afterLoadExecute();
  }

  afterLoadExecute() {
    if (this.afterLoad) {
      this.afterLoad.forEach((builder: Builder) => {
        builder.onLoad(this);
        builder.loadEvents();
      });
    }
  }

  async listen() {
    await this.listenFn(this.listenConfig);
  }

  getResource(resourceName: HandlerResourceTypes): Resource {
    return this.resources[getResourceName(resourceName)];
  }

  addRoutes(routes: RoutesType): void {
    if (routes instanceof RoutesBuilder || routes instanceof PathBuilder) {
      this.controllers.push(routes.build());
    } else if (routes instanceof Builder) {
      routes.preLoad(this);
      this.controllers.push(routes.loadRoutes(this.prefix));
      this.afterLoad?.push(routes);
    } else if (routes instanceof BuilderInject) {
      routes.builder.preLoad(this);
      this.controllers.push(routes.builder.loadRoutes(this.prefix));
      this.afterLoad?.push(routes.builder);
    } else if (typeof routes === 'function') {
      const builder = new routes();
      builder.preLoad(this);
      this.controllers.push(builder.loadRoutes(this.prefix));
      this.afterLoad?.push(builder);
    } else {
      this.controllers.push(routes);
    }
  }

  addHandlers(handlers: HandlersType): void {
    if (handlers instanceof Builder) {
      this.handlers = {
        ...this.handlers,
        ...handlers.loadHandlers(this.prefix)
      };
      this.afterLoad?.push(handlers);
    } else if (handlers instanceof BuilderInject) {
      this.handlers = {
        ...this.handlers,
        ...handlers.builder.loadHandlers(this.prefix)
      };
      this.afterLoad?.push(handlers.builder);
    } else if (typeof handlers === 'function') {
      const builder = new handlers();
      this.handlers = {
        ...this.handlers,
        ...builder.loadHandlers(this.prefix)
      };
      this.afterLoad?.push(builder);
    }
  }

  addEvents(events: EventsType): void {
    if (events instanceof Builder) {
      this.afterLoad?.push(events);
    } else if (events instanceof BuilderInject) {
      this.afterLoad?.push(events.builder);
    } else if (typeof events === 'function') {
      const builder = new events();
      this.afterLoad?.push(builder);
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

export { PathBuilder, RoutesBuilder } from './resources/controllers';
export { makeResponses } from './resources/openapi/responses';
export {
  SchemaBuilder,
  AutoColumn,
  TableBuilder,
  SchemaModelsBuilder
} from './resources/sequelize/builder';
export { ResourceType } from './resources/sequelize';
export { DataTypes } from 'sequelize';
export {
  Sequelize,
  SequelizeModel as Model,
  Tags,
  HandlerMethods,
  HandlerMethodType,
  Handlers
};
export { HandlerType } from './resources/controllers/routes';

export { FastifyReply as Reply, FastifyRequest as Request };
export { OpenAPI } from './resources/openapi/openapiTypes';

export { Get, Post, Put, Patch, Delete } from './decorators/routes';
export { Create, GetAll, GetOne, Update, Remove } from './decorators/handlers';
export {
  OnCreate,
  OnGetAll,
  OnGetOne,
  OnUpdate,
  OnRemove,
  OnEvent
} from './decorators/events';
export { Builder } from './decorators/builder';

export const events = {
  on,
  emit,
  remove,
  onAction,
  emitAction,
  removeAction
};

export { inject } from './decorators/inject';

export interface HandlerEventData {
  request: FastifyRequest;
  data?: any;
}
