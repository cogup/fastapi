import 'reflect-metadata';
import { HandlerType } from '..';
import { EventKey } from '../resources/events';
export declare function OnCreate(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnGetAll(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnGetOne(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnUpdate(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnRemove(event: EventKey): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export interface CustomEventItem {
    eventKey: string;
}
export declare function OnEvent<T>(eventKey: T): (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export interface CustomActionItem {
    model: EventKey;
    action: HandlerType;
}
