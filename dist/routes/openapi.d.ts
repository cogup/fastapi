import { DocData } from '../resources/openapi/doc';
import { Routes } from '../resources/routes';
import { JSONSchema7 } from 'json-schema';
export default function builderOpeapi(data: DocData): Routes;
export declare function objectToJSONSchema7(json: any): JSONSchema7;
