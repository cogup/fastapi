import { DocData } from '../resources/openapi/doc';
import { OpenAPI } from '../resources/openapi/openapiTypes';
import { Controllers } from '../resources/controllers';
import { JSONSchema7 } from 'json-schema';
export interface OpenApiBuilded {
    spec: OpenAPI;
    controllers: Controllers;
}
export declare function cloneObject(objeto: any): any;
export default function builderOpenapi(data: DocData, prefix: string): OpenApiBuilded;
export declare function objectToJSONSchema7(json: any): JSONSchema7;
