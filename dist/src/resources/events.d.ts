import { Model } from 'index';
export interface EventCallback {
    (err: any, data: any): void;
}
export interface EventsStorage {
    [key: string]: EventCallback[];
}
export type EventKey = string | typeof Model;
export declare function on<T>(model: EventKey, action: T, callback: EventCallback): void;
export declare function emit<T>(model: EventKey, action: T, err: any, data?: any): void;
export declare function remove<T>(model: EventKey, action: T): void;
