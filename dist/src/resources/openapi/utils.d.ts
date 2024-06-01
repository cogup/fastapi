import { RouteHandler } from 'fastify';
import { InnerOperation } from '../controllers';
import { OpenAPI, Operation, Path } from './openapiTypes';
export declare function extractByMethod(method: string, target: InnerOperation | Path): Operation | RouteHandler | undefined;
export declare function convertOpenAPItoSchemas(openAPI: OpenAPI): OpenAPI;
export declare function convertToPlural(resourceName: string): string;
export declare function convertToSingle(resourceName: string): string;
