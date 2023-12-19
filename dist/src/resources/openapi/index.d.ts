import { Resource } from '../sequelize';
import { OpenAPI } from './openapiTypes';
export interface Tags {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
    list: string[];
}
export interface HandlerPaths {
    many: string;
    single: string;
}
export declare function generatePaths(name: string): HandlerPaths;
export declare function generateOpenAPISchemas(resource: Resource, tags: Tags): OpenAPI;
