import { Tags } from './resources/openapi';
import { HandlerMethods, Methods, PathBuilder, Route, Routes, RoutesBuilder, Handlers, HandlerMethodType } from './resources/routes';
import { Resource, Resources, Schema, SequelizeModel, SequelizeResources } from './resources/sequelize';
import { on, emit, remove, EventCallback, EventKey } from './resources/events';
import { OpenAPI } from './resources/openapi/openapiTypes';
import { Sequelize } from 'sequelize';
import log from './resources/log';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import { SchemaModelsBuilder, TableBuilder } from './resources/sequelize/builder';
import { FastifyInstance, FastifyListenOptions, FastifyReply, FastifyRequest } from 'fastify';
import { MakeHandlers } from './decorators/handlers';
import { MakeRouters } from './decorators/routes';
export declare function getAppVersion(): string;
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
    handlers?: Handlers;
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
export type RoutesType = Routes | RoutesBuilder | PathBuilder | typeof MakeRouters | MakeRouters;
export declare class FastAPI {
    info: DocInfo;
    servers: ServerObject[];
    listenConfig: FastifyListenOptions;
    rawRoutes: RoutesType[];
    routes: Routes[];
    tags: Tags;
    handlers: Handlers;
    private schema?;
    resources: Resources;
    models: Models;
    cors: Cors;
    forceCreateTables: boolean;
    api: FastifyInstance;
    private listenFn;
    sequelize?: Sequelize;
    openAPISpec?: OpenAPI;
    private afterLoad;
    autoLoadSchema: boolean;
    autoLoadRoutes: boolean;
    constructor(props?: FastAPIOptions);
    setSequelize(sequelize: Sequelize): void;
    setSchema(schema: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    private loadRawRoutes;
    loadSchema(schema?: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    loadRoutes(): void;
    afterLoadExecute(): void;
    listen(): Promise<void>;
    getResource(resourceName: string | TableBuilder): Resource;
    addRoutes(routes: RoutesType): void;
    addHandlers(handlers: Handlers | typeof MakeHandlers): void;
    path(path: string, options: Methods): FastAPI;
    get(path: string, options: Route): FastAPI;
    post(path: string, options: Route): FastAPI;
    put(path: string, options: Route): FastAPI;
    delete(path: string, options: Route): FastAPI;
    patch(path: string, options: Route): FastAPI;
    on<T>(modelName: EventKey, action: T, callback: EventCallback): FastAPI;
    emit<T>(modelName: EventKey, action: T, err: any, data: any): FastAPI;
    removeListener<T>(modelName: EventKey, action: T): FastAPI;
    getOpenAPISpec(): OpenAPI;
}
export { PathBuilder, RoutesBuilder } from './resources/routes';
export { makeResponses } from './resources/openapi/responses';
export { SchemaBuilder, AutoColumn, TableBuilder, SchemaModelsBuilder } from './resources/sequelize/builder';
export { ResourceType } from './resources/sequelize';
export { Sequelize, SequelizeModel as Model, Tags, log, HandlerMethods, HandlerMethodType, Handlers };
export { HandlerType } from './resources/routes/routes';
export { FastifyReply as Reply, FastifyRequest as Request };
export { OpenAPI } from './resources/openapi/openapiTypes';
export { Get, Post, Put, Patch, Delete, MakeRouters } from './decorators/routes';
export { Create, GetAll, GetOne, Update, Remove, MakeHandlers } from './decorators/handlers';
export declare const events: {
    on: typeof on;
    emit: typeof emit;
    remove: typeof remove;
};
