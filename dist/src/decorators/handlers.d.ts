import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';
export declare function getResourceName(resourceName: string | TableBuilder): string;
export declare function Create(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetAll(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetOne(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Update(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Remove(resourceName: string | TableBuilder): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getPathByMethod(resourceName: string, method: HandlerMethodType): string;
export declare class MakeHandlers {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    getHandlers(): Handlers;
}
