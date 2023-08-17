import { OpenAPI, Paths } from './openapiTypes';
export interface ServerObject {
    url: string;
    description?: string;
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
}
export declare function createFullDoc(data: DocData): OpenAPI;
