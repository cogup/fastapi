import { Operation } from 'src/resources/openapi/openapiTypes';
import { HandlerMethodType, Handlers, MethodType, Routes } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from 'src';
export declare function getResourceName(resourceName: string | TableBuilder): string;
export declare function Create(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetAll(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetOne(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Update(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Remove(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getPathByMethod(resourceName: string, method: HandlerMethodType): string;
export declare class MakeHandlers {
    [key: string]: any;
    onLoad(_fastapi: FastAPI): void;
    getHandlers(): Handlers;
}
export interface Route extends Operation {
    path: string;
}
export interface RouteItem {
    route: Route;
    methodType: MethodType;
}
export declare function Get(route: string | Route): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Post(route: string | Route): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Put(route: string | Route): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Delete(route: string | Route): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Patch(route: string | Route): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class MakeRouters {
    [key: string]: any;
    onLoad(_fastapi: FastAPI): void;
    getRoutes(): Routes;
}
