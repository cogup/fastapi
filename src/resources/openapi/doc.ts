import { convertOpenAPItoSchemas } from './utils';
import { OpenAPI, Paths, XAdminData } from './openapiTypes';

interface PathObject {
  [path: string]: PathItemObject;
}

interface PathItemObject {
  servers?: ServerObject[];
}

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

export function createFullDoc(data: DocData, xAdmin: XAdminData): OpenAPI {
  const openapi: OpenAPI = {
    openapi: '3.0.0',
    info: data.info,
    servers: data.servers,
    paths: resolvePaths(data.paths),
    'x-admin': xAdmin
  };

  return convertOpenAPItoSchemas(openapi);
}

const resolvePaths = (schemas: PathObject): PathObject => {
  Object.keys(schemas).forEach((path) => {
    schemas[path].servers = [
      {
        url: process.env.APP_URL || 'http://localhost:3000'
      }
    ];
  });

  return schemas;
};
