import 'reflect-metadata';
import { FastAPI, Handlers } from '..';
import { Controllers } from '../resources/controllers';
export interface BuilderItems {
    routes?: Controllers;
    handlers?: Handlers;
}
export declare class Builder {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    loadEvents(): void;
    loadHandlers(prefix: string): Handlers;
    loadRoutes(defaultPrefix: string): Controllers;
}
