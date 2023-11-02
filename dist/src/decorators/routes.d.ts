import { Operation } from '../resources/openapi/openapiTypes';
import { MethodType, Routes } from '../resources/routes';
import 'reflect-metadata';
import { FastAPI } from '..';
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
    onLoad(_fastAPI: FastAPI): void;
    getRoutes(): Routes;
}