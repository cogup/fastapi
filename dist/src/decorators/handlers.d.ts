import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';
import { SequelizeModel } from '../resources/sequelize';
export type ResourceTypes = string | TableBuilder | typeof SequelizeModel;
export declare function getResourceName(resourceName: ResourceTypes): string;
export declare function Create(handler: ResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetAll(handler: ResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetOne(handler: ResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Update(handler: ResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Remove(handler: ResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getPathByMethod(resourceName: string, method: HandlerMethodType): string;
export declare class MakeHandlers {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    getHandlers(): Handlers;
}
