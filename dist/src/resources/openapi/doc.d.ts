import { OpenAPI, Paths, AdminData } from './openapiTypes';
export interface ServerObject {
    url: string;
    description?: string;
    'x-name'?: string;
}
export interface DocInfo {
    title: string;
    description: string;
    version: string;
}
export interface DocData {
    info: DocInfo;
    paths: Paths;
    servers: ServerObject[];
    admin: AdminData;
}
export declare function createFullDoc(data: DocData): OpenAPI;
