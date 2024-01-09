import { Tags } from './resources/openapi';
import { HandlerMethods, Methods, PathBuilder, Route, Routes, RoutesBuilder, Handlers, HandlerMethodType } from './resources/routes';
import { Resource, Resources, Schema, SequelizeModel, SequelizeResources } from './resources/sequelize';
import { on, emit, remove, EventCallback, EventKey, onAction, emitAction, removeAction } from './resources/events';
import { OpenAPI } from './resources/openapi/openapiTypes';
import { Sequelize } from 'sequelize';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import { SchemaModelsBuilder } from './resources/sequelize/builder';
import { FastifyInstance, FastifyListenOptions, FastifyReply, FastifyRequest } from 'fastify';
import { HandlerResourceTypes } from './decorators/handlers';
import { Builder } from './decorators/builder';
import { BuilderInject } from './decorators/inject';
export declare function getAppVersion(): string;
export interface LoadSpecOptions {
    resources: Resources;
    tags?: Tags;
    routes?: Routes[];
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
}
export interface Cors {
    origin: string;
}
export interface Models {
    [key: string]: typeof SequelizeModel;
}
export type RoutesType = Routes | RoutesBuilder | PathBuilder | typeof Builder | Builder | BuilderInject;
export type HandlersType = Handlers | typeof Builder | Builder | BuilderInject;
export type EventsType = typeof Builder | Builder | BuilderInject;
export declare class FastAPI {
    info: DocInfo;
    servers: ServerObject[];
    listenConfig: FastifyListenOptions;
    private rawRoutes;
    routes: Routes[];
    tags: Tags;
    private rawHandlers;
    private rawEvents;
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
    autoLoadHandlers: boolean;
    autoLoadEvents: boolean;
    constructor(props?: FastAPIOptions);
    setSequelize(sequelize: Sequelize): void;
    setSchema(schema: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    private loadRawRoutes;
    private loadRawHandlers;
    private loadRawEvents;
    loadSchema(schema?: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    loadRoutes(): void;
    afterLoadExecute(): void;
    listen(): Promise<void>;
    getResource(resourceName: HandlerResourceTypes): Resource;
    addRoutes(routes: RoutesType): void;
    addHandlers(handlers: HandlersType): void;
    addEvents(events: EventsType): void;
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
export { DataTypes } from 'sequelize';
export { Sequelize, SequelizeModel as Model, Tags, HandlerMethods, HandlerMethodType, Handlers };
export { HandlerType } from './resources/routes/routes';
export { FastifyReply as Reply, FastifyRequest as Request };
export { OpenAPI } from './resources/openapi/openapiTypes';
export { Get, Post, Put, Patch, Delete } from './decorators/routes';
export { Create, GetAll, GetOne, Update, Remove } from './decorators/handlers';
export { OnCreate, OnGetAll, OnGetOne, OnUpdate, OnRemove, OnEvent } from './decorators/events';
export { Builder } from './decorators/builder';
export declare const events: {
    on: typeof on;
    emit: typeof emit;
    remove: typeof remove;
    onAction: typeof onAction;
    emitAction: typeof emitAction;
    removeAction: typeof removeAction;
};
export { inject } from './decorators/inject';
export interface HandlerEventData {
    request: FastifyRequest;
    data?: any;
}
