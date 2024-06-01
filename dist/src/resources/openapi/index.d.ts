import { Resource, Resources } from '../sequelize';
import { OpenAPI, Paths } from './openapiTypes';
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
export declare function generatePaths(prefix: string, name: string): HandlerPaths;
export declare function generateOpenAPISchemas(resource: Resource, tags: Tags, prefix: string): OpenAPI;
export declare function insertIncludeOnOpenAPISchemas(paths: Paths, resources: Resources, prefix: string): Paths;
