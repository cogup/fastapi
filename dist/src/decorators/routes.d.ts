import { Operation } from '../resources/openapi/openapiTypes';
import { MethodType } from '../resources/controllers';
import 'reflect-metadata';
export interface Route extends Operation {
    path: string;
    prefix?: string;
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
