import { TableBuilder } from '../resources/sequelize/builder';
import 'reflect-metadata';
import { FastAPI } from '..';
import { SequelizeModel } from '../resources/sequelize';
import { EventKey } from '../resources/events';
export type EventResourceTypes = string | TableBuilder | typeof SequelizeModel;
export declare function getResourceName(resourceName: EventResourceTypes): string;
export declare function OnCreate(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnGetAll(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnGetOne(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnUpdate(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnRemove(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnEvent<T>(model: EventKey, action: T): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class MakeEvents {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    loadEvents(): void;
}
