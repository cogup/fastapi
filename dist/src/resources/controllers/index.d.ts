import { RouteHandler } from './routes';
import { Resource } from '../sequelize';
import { AdminData, Operation, Paths, Properties, Reference, Responses } from '../openapi/openapiTypes';
import { FastifyInstance } from 'fastify';
export declare enum MethodType {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch"
}
export declare enum HandlerMethodType {
    GET_ALL = "getAll",
    GET_ONE = "getOne",
    CREATE = "create",
    UPDATE = "update",
    REMOVE = "remove"
}
export interface HandlerMethods {
    getAll?: RouteHandler;
    getOne?: RouteHandler;
    create?: RouteHandler;
    update?: RouteHandler;
    remove?: RouteHandler;
}
export interface Handlers {
    [path: string]: HandlerMethods;
}
export interface ResourceProps {
    paths: Paths;
    handlers?: Handlers;
    resource: Resource;
    adminData: AdminData;
}
export interface InnerOperation {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
    patch?: Operation;
}
export interface Controllers {
    [path: string]: Methods;
}
export interface Methods {
    get?: Route;
    post?: Route;
    put?: Route;
    delete?: Route;
    patch?: Route;
}
export interface Route extends Operation {
    handler: RouteHandler;
}
export declare function routesToPaths(controllers: Controllers): Paths;
export declare class PathBuilder {
    private methods;
    private pathName;
    private parent;
    private builded;
    constructor(parent: RoutesBuilder, pathName: string);
    get(route: Route): this;
    post(route: Route): this;
    put(route: Route): this;
    delete(route: Route): this;
    patch(route: Route): this;
    buildPath(): void;
    path(path: string): PathBuilder;
    responses(defaultSuccessStatusCode: number, successProperties: Properties, conflict?: boolean): Responses;
    build(): Controllers;
}
export declare class RoutesBuilder {
    private controllers;
    private resourceName;
    constructor(resourceName?: string);
    addRoute(path: string, method: MethodType, route: Route): void;
    path(path: string): PathBuilder;
    responses(defaultSuccessStatusCode: number, successProperties: Properties | Reference, conflict?: boolean): Responses;
    build(): Controllers;
}
interface RouterInner {
    path: string;
    method: string;
    handler: RouteHandler;
    operation: Operation;
}
export declare class CreateRoutes {
    api: FastifyInstance;
    constructor(api: FastifyInstance);
    createRoutes(controllers: Controllers): void;
    createRouteResource({ paths, resource, handlers, adminData }: ResourceProps): void;
    getHandler(handlers: Handlers | undefined, path: string, method: string, resource: Resource, operation: Operation, adminData: AdminData): RouteHandler;
    getMediaType(content: any): string;
    createRouteInner({ path, method, operation, handler }: RouterInner): void;
}
export declare function resolveResponses(responses: Responses): {
    [key: string]: any;
};
export {};
