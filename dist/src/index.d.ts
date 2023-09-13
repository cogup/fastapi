import { FastifyRequest, FastifyReply, FastifyListenOptions, FastifyInstance } from 'fastify';
import { Tags } from './resources/openapi';
import { HandlerMethods, Methods, PathBuilder, Route, Routes, RoutesBuilder, Handlers, HandlerMethodType } from './resources/routes';
import { Resource, Resources, Schema, SequelizeModel, SequelizeResources } from './resources/sequelize';
import { EventCallback } from './resources/events';
import { OpenAPI } from './resources/openapi/openapiTypes';
import { Options, Sequelize } from 'sequelize';
import log from './resources/log';
import { DocInfo, ServerObject } from './resources/openapi/doc';
import { SchemaModelsBuilder, TableBuilder } from './resources/sequelize/builder';
import { MakeHandlers, MakeRouters } from './routes/makes';
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
    server?: ServerObject[];
}
export interface Cors {
    origin: string;
}
export interface Models {
    [key: string]: typeof SequelizeModel;
}
export declare class FastAPI {
    info: DocInfo;
    servers: ServerObject[];
    listenConfig: FastifyListenOptions;
    routes: Routes[];
    tags: Tags;
    handlers: Handlers;
    private schema?;
    resources: Resources;
    models: Models;
    database: DatabaseOptions;
    cors: Cors;
    forceCreateTables: boolean;
    api: FastifyInstance;
    private listenFn;
    sequelize?: Sequelize;
    openapiSpec?: OpenAPI;
    private afterLoad;
    private loadedResources;
    constructor(props?: FastAPIOptions);
    private loadDatabaseInstance;
    setDatabaseInstance(sequelize: Sequelize): void;
    setSchema(schema: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    loadSchema(schema?: Schema | SequelizeResources[] | SchemaModelsBuilder): void;
    loadRoutes(): void;
    loadResources(): void;
    setDatabase(database: Options): FastAPI;
    dbConnect(): Promise<void>;
    private createTables;
    testDatabaseConnection(): Promise<void>;
    afterLoadExecute(): void;
    listen(): Promise<void>;
    start(): Promise<void>;
    getResource(resourceName: string | TableBuilder): Resource;
    addRoutes(routes: Routes | RoutesBuilder | PathBuilder | typeof MakeRouters | MakeRouters): void;
    addHandlers(handlers: Handlers | typeof MakeHandlers): void;
    path(path: string, options: Methods): FastAPI;
    get(path: string, options: Route): FastAPI;
    post(path: string, options: Route): FastAPI;
    put(path: string, options: Route): FastAPI;
    delete(path: string, options: Route): FastAPI;
    patch(path: string, options: Route): FastAPI;
    on(modelName: string, action: string, callback: EventCallback): FastAPI;
    emit(modelName: string, action: string, err: any, data: any): FastAPI;
    removeListener(modelName: string, action: string): FastAPI;
}
export { PathBuilder, RoutesBuilder } from './resources/routes';
export { makeResponses } from './resources/openapi/responses';
export { SchemaBuilder, AutoColumn, TableBuilder, SchemaModelsBuilder } from './resources/sequelize/builder';
export { ColumnType } from './resources/sequelize';
export { Sequelize, SequelizeModel as Model, Tags, log, HandlerMethods, HandlerMethodType, Handlers };
export { FastifyReply as Reply, FastifyRequest as Request };
export { DataTypes } from 'sequelize';
export * as Decorators from './routes/makes';
