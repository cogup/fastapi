import { RouteHandler } from 'fastify';
import { InnerOperation } from '../controllers';
import { OpenAPI, Operation, Response, Parameter, Path } from './openapiTypes';

export function extractByMethod(
  method: string,
  target: InnerOperation | Path
): Operation | RouteHandler | undefined {
  if (method === 'get') {
    return target.get;
  } else if (method === 'post') {
    return target.post;
  } else if (method === 'put') {
    return target.put;
  } else if (method === 'delete') {
    return target.delete;
  } else if (method === 'patch') {
    return target.patch;
  }
}

export function convertOpenAPItoSchemas(openAPI: OpenAPI): OpenAPI {
  const schemasCache: Record<string, string> = {};

  // Create the components object if it doesn't exist
  if (!openAPI.components) {
    openAPI.components = {};
  }

  // Create the schemas object inside components if it doesn't exist
  if (!openAPI.components.schemas) {
    openAPI.components.schemas = {};
  }

  // Iterate over the paths defined in OpenAPI
  for (const path in openAPI.paths) {
    const pathItem = openAPI.paths[path];

    for (const method in pathItem) {
      if (method !== 'parameters') {
        const operation = extractByMethod(method, pathItem) as Operation;
        if (!operation) continue;

        const { responses } = operation;

        for (const statusCode in responses) {
          const response = responses[statusCode];
          const { content } = response as Response;

          for (const contentType in content) {
            const mediaType = content[contentType];
            const schema = mediaType.schema;

            if (schema) {
              if ('$ref' in schema) {
                continue;
              }

              const schemaKey = JSON.stringify(schema);

              // Check if the schema has already been registered
              if (schemasCache[schemaKey]) {
                // Reuse the existing schema
                mediaType.schema = {
                  $ref: `#/components/schemas/${schemasCache[schemaKey]}`
                };
              } else {
                const schemaName = getReferenceSchemaNameInner(
                  path,
                  method,
                  statusCode
                );

                // Add the schema to the schemas object
                schemasCache[schemaKey] = schemaName;
                openAPI.components.schemas[schemaName] = schema;

                // Update the reference to the schema
                mediaType.schema = {
                  $ref: `#/components/schemas/${schemaName}`
                };
              }
            }
          }
        }

        // Check for undeclared path parameters
        const parameters = (operation.parameters as Parameter[]) ?? [];
        const declaredPathParams = (path.match(/{\w+}/g) as string[]) ?? [];

        parameters.forEach((parameter) => {
          if (
            parameter.in === 'path' &&
            !declaredPathParams.includes(`{${parameter.name}}`)
          ) {
            throw new Error(
              `Declared path parameter "${parameter.name}" needs to be defined as a path parameter at either the path or operation level`
            );
          }
        });
      }
    }
  }

  return openAPI;
}

function getReferenceSchemaNameInner(
  path: string,
  method: string,
  statusCode: string | number
): string {
  return `${method.toUpperCase()}_${path.replace(
    // eslint-disable-next-line no-useless-escape
    /[\/\:\{\}]/g,
    '_'
  )}_${statusCode}`
    .replace(/__/g, '_')
    .replace(/_$/, '');
}

export function convertToPlural(resourceName: string): string {
  if (resourceName.endsWith('y')) {
    return resourceName.slice(0, -1) + 'ies';
  }

  return resourceName.endsWith('s') ? resourceName : `${resourceName}s`;
}

export function convertToSingle(resourceName: string): string {
  if (resourceName.endsWith('ies')) {
    return resourceName.slice(0, -3) + 'y';
  }

  return resourceName.endsWith('s') ? resourceName.slice(0, -1) : resourceName;
}
