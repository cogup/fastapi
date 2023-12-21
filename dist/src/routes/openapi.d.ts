import { DocData } from '../resources/openapi/doc';
import { OpenAPI } from '../resources/openapi/openapiTypes';
import { Routes } from '../resources/routes';
import { JSONSchema7 } from 'json-schema';
export interface OpenApiBuilded {
    spec: OpenAPI;
    routes: Routes;
}
export default function builderOpenapi(data: DocData): OpenApiBuilded;
export declare function objectToJSONSchema7(json: any): JSONSchema7;
