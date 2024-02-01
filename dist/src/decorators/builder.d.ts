import 'reflect-metadata';
import { FastAPI, Handlers } from '..';
import { Routes } from '../resources/routes';
export interface BuilderItems {
    routes?: Routes;
    handlers?: Handlers;
}
export declare class Builder {
    [key: string]: any;
    onLoad(fastAPI: FastAPI): void;
    loadEvents(): void;
    loadHandlers(prefix: string): Handlers;
    loadRoutes(defaultPrefix: string): Routes;
}
