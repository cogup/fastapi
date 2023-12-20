import { HandlerMethodType, Handlers } from '../resources/routes';
import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';
import { SequelizeModel } from '../resources/sequelize';
export type HandlerResourceTypes = string | TableBuilder | typeof SequelizeModel;
export declare function getResourceName(resourceName: HandlerResourceTypes): string;
export declare function Create(handler: HandlerResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetAll(handler: HandlerResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function GetOne(handler: HandlerResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Update(handler: HandlerResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Remove(handler: HandlerResourceTypes): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getPathByMethod(resourceName: string, method: HandlerMethodType): string;
export declare class MakeHandlers {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    getHandlers(): Handlers;
}
