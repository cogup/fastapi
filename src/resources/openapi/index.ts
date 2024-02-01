import { Resource, Resources } from '../sequelize';
import { convertType } from './dataTypes';
import {
  AdminData,
  MediaType,
  OpenAPI,
  Operation,
  Parameter,
  Paths,
  Properties,
  Response,
  Schema
} from './openapiTypes';
import { makeResponses } from './responses';
import { convertToPlural, convertToSingle } from './utils';

export interface Tags {
  create: string[];
  read: string[];
  update: string[];
  delete: string[];
  list: string[];
}

interface Property {
  type: string;
  description: string;
  maxLength?: number;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: any;
  immutable?: boolean;
  anyOf?: Property[];
  allOf?: Property[];
  oneOf?: Property[];
  not?: Property;
  items?: Property;
  required?: string[];
  properties?: SchemaProperties;
  additionalProperties?: boolean;
  format?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  'x-admin-type'?: string;
  protected?: boolean;
}

interface SchemaProperties {
  [key: string]: Property;
}

const resolveTags = (name: string, tags: string[] = []): string[] => {
  const resourceName = name.toLowerCase();

  return tags.map((tag) => {
    if (tag.indexOf('$name') > -1) {
      return tag.replace('$name', resourceName);
    }

    return tag;
  });
};

const removeImutable = (
  properties: SchemaProperties,
  removeOnlyAllProp: boolean = false
): SchemaProperties => {
  const newProperties: SchemaProperties = {};

  Object.entries(properties).forEach(([key, value]) => {
    const immutable = value.immutable;

    delete value.immutable;

    if (removeOnlyAllProp && immutable) {
      return;
    }

    newProperties[key] = value;
  });

  return newProperties;
};

const removeProtected = (props: SchemaProperties): SchemaProperties => {
  const newProperties: SchemaProperties = {};

  Object.entries(props).forEach(([key, value]) => {
    const result = value.protected;

    delete value.protected;

    if (result === true) {
      return;
    }

    newProperties[key] = value;
  });

  return newProperties;
};

export interface HandlerPaths {
  many: string;
  single: string;
}

export function generatePaths(prefix: string, name: string): HandlerPaths {
  const resourceName = name.toLowerCase();
  const pluralName = convertToPlural(resourceName);

  return {
    many: `${prefix}/${pluralName}`,
    single: `${prefix}/${pluralName}/{id}`
  };
}

export function generateOpenAPISchemas(
  resource: Resource,
  tags: Tags,
  prefix: string
): OpenAPI {
  const { model, columns, search, name, group } = resource;
  const groupName =
    group !== undefined ? group.toLowerCase() : convertToSingle(name);
  group !== undefined ? group.toLowerCase() : convertToSingle(name);
  const handlerPaths = generatePaths(prefix, name);

  const attributeKeys = Object.keys(model.getAttributes());
  const properties: SchemaProperties = {};
  const required: string[] = [];

  attributeKeys.forEach((key) => {
    const column = columns[key];

    if (column.private) {
      return;
    }

    const attribute = model.getAttributes()[key];
    const propertyType = convertType(attribute.type.constructor.name);

    const property: Property = {
      ...propertyType,
      description: ''
    };

    if (
      property.type === 'string' &&
      'maxLength' in column &&
      column.maxLength !== undefined
    ) {
      property.maxLength = column.maxLength;
    }

    if (attribute.type.constructor.name === 'ENUM') {
      property.type = 'string';
      property.enum = column.values;
    }

    if ('min' in column) {
      property.minimum = column.min;
    }

    if ('max' in column) {
      property.maximum = column.max;
    }

    if ('defaultValue' in column) {
      property.default = column.defaultValue;
    }

    if ('immutable' in column) {
      property.immutable = column.immutable;
    }

    if (column.allowNull === true) {
      property.nullable = true;
    }

    if (column.description !== undefined) {
      property.description = column.description;
    }

    property['x-admin-type'] = column.type;
    property.protected = column.protected;

    properties[key] = property;
    if (!attribute.allowNull || column.required) {
      required.push(key);
    }
  });

  const makeAllResponseProperties = (props: Properties): any => {
    return {
      data: {
        type: 'array',
        properties: {
          type: 'object',
          properties: props
        }
      },
      meta: {
        type: 'object',
        properties: {
          offset: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
          totalItems: { type: 'integer' }
        }
      }
    };
  };

  const makeCreateProperties = (prop: SchemaProperties): SchemaProperties => {
    const postProperties = { ...prop };
    delete postProperties.id;
    delete postProperties.createdAt;
    delete postProperties.updatedAt;
    return removeImutable(postProperties, true);
  };

  const getOrderByEnumValues = (): string[] => {
    const sortFields = Object.keys(properties);
    return sortFields.map((field) =>
      field.startsWith('-') ? field.substring(1) : field
    );
  };

  const createProperties = makeCreateProperties(properties);
  const updateProperties = createProperties;

  const responseProperties = removeProtected(removeImutable(properties, false));

  const responseResolvedPost = makeResponses(
    name,
    201,
    responseProperties,
    true
  );
  const responseResolvedDelete = makeResponses(name, 204, responseProperties);
  const responseResolvedGet = makeResponses(name, 200, responseProperties);
  const responseResolvedPut = responseResolvedGet;
  const responseResolvedList = makeResponses(
    name,
    200,
    makeAllResponseProperties(responseProperties)
  );

  const adminData: AdminData = {
    resources: {
      [handlerPaths.many]: {
        get: {
          types: (() => {
            if (search && search.length > 0) {
              return ['list', 'search'];
            } else {
              return ['list'];
            }
          })()
        },
        post: {
          types: ['create']
        }
      },
      [handlerPaths.single]: {
        get: {
          types: ['read']
        },
        put: {
          types: ['update']
        },
        delete: {
          types: ['delete']
        }
      }
    }
  };

  return {
    'x-admin': adminData,
    paths: {
      [handlerPaths.many]: {
        get: {
          summary: `List ${groupName}`,
          description: `List and search ${groupName}`,
          tags: resolveTags(groupName, tags.list),
          parameters: [
            {
              name: 'offset',
              in: 'query',
              description: 'Offset of items',
              schema: {
                type: 'integer',
                minimum: 0
              }
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: {
                type: 'integer',
                minimum: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Max number of items per request',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 1000
              }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search query string',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'orderBy',
              in: 'query',
              description: 'Order field',
              schema: {
                type: 'string',
                enum: getOrderByEnumValues()
              }
            },
            {
              name: 'order',
              in: 'query',
              description: 'Order direction',
              schema: {
                type: 'string',
                enum: ['desc', 'asc']
              }
            }
          ],
          responses: responseResolvedList
        },
        post: {
          summary: `Create ${groupName}`,
          description: `Create ${groupName}`,
          tags: resolveTags(groupName, tags.create),
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: createProperties
                }
              }
            }
          },
          responses: responseResolvedPost
        }
      },
      [handlerPaths.single]: {
        get: {
          summary: `Get ${groupName} by ID`,
          description: `Get ${groupName} by ID`,
          tags: resolveTags(groupName, tags.read),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `${groupName} ID`,
              schema: {
                type: 'integer'
              },
              required: true
            }
          ],
          responses: responseResolvedGet
        },
        put: {
          summary: `Update ${groupName}`,
          description: `Update ${groupName}`,
          tags: resolveTags(groupName, tags.update),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `${groupName} ID`,
              schema: {
                type: 'integer'
              },
              required: true
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: updateProperties
                }
              }
            }
          },
          responses: responseResolvedPut
        },
        delete: {
          summary: `Delete ${groupName}`,
          description: `Delete ${groupName}`,
          tags: resolveTags(groupName, tags.delete),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `${groupName} ID`,
              schema: {
                type: 'integer'
              },
              required: true
            }
          ],
          responses: responseResolvedDelete
        }
      }
    }
  };
}

// copy schemas on includes
export function insertIncludeOnOpenAPISchemas(
  paths: Paths,
  resources: Resources,
  prefix: string
): Paths {
  const newPaths: Paths = { ...paths };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(resources).forEach(([key, value]) => {
    const { name, include } = value;

    if (include === undefined) {
      return;
    }

    const pathsNames = generatePaths(prefix, name);

    const pathMany = newPaths[pathsNames.many];

    if (pathMany === undefined) {
      return;
    }

    const getAll = pathMany.get;

    if (getAll === undefined) {
      return;
    }

    const pathSingle = newPaths[pathsNames.single];

    if (pathSingle === undefined) {
      return;
    }

    const getOne = pathSingle.get;

    if (getOne === undefined) {
      return;
    }

    const propertiesAll = getPropertiesByOperation(getAll, 200) as any;

    const getAllProperties = {
      ...propertiesAll.data.items.properties
    };

    const getOneProperties = getPropertiesByOperation(getOne, 200) as any;

    const parametersGetAll = getAll.parameters ?? [];
    const parametersGeOne = getOne.parameters ?? [];

    parametersGeOne.push({
      name: 'include',
      in: 'query',
      description: `Include ${include
        .map((i) => i.model.name.toLowerCase())
        .join(', ')}`,
      schema: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    } as Parameter);

    parametersGetAll.push({
      name: 'include',
      in: 'query',
      description: `Include ${include
        .map((i) => i.model.name.toLowerCase())
        .join(', ')}`,
      schema: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    } as Parameter);

    include.forEach((include) => {
      const includeProperties = getIncludeProperties(
        include.model.name,
        paths,
        resources,
        prefix
      );

      getAllProperties[include.as] = {
        type: 'object',
        nullable: true,
        properties: {
          [include.as]: includeProperties
        }
      };

      getOneProperties[include.as] = {
        type: 'object',
        nullable: true,
        properties: {
          ...includeProperties
        }
      };
    });
    const newGetAll = resolveNewOperation(
      getAll,
      {
        ...propertiesAll,
        data: {
          ...propertiesAll.data,
          items: {
            ...propertiesAll.data.items,
            properties: getAllProperties
          }
        }
      },
      200
    );

    newPaths[pathsNames.many] = {
      ...pathMany,
      get: newGetAll
    };

    const newGetOne = resolveNewOperation(getOne, getOneProperties, 200);

    newPaths[pathsNames.single] = {
      ...pathSingle,
      get: newGetOne
    };
  });

  return newPaths;
}

function resolveNewOperation(
  operator: Operation,
  properties: SchemaProperties,
  statusCode: number
): Operation {
  const responseOkRaw = operator.responses[statusCode] as Response;
  const responseOkContent = responseOkRaw.content as {
    [mediaType: string]: MediaType;
  };

  const newOperator = {
    ...operator,
    responses: {
      ...operator.responses,
      [statusCode]: {
        ...responseOkRaw,
        content: {
          ...responseOkRaw.content,
          'application/json': {
            ...responseOkContent['application/json'],
            schema: {
              ...responseOkContent['application/json'].schema,
              properties: {
                ...properties
              }
            }
          }
        }
      }
    }
  } as Operation;

  return newOperator;
}

function getIncludeProperties(
  target: string,
  paths: Paths,
  resources: Resources,
  prefix: string
): Schema {
  const resource = resources[target];

  if (resource === undefined) {
    return {};
  }

  const { name, include } = resource;

  if (include === undefined) {
    return {};
  }

  const pathsNames = generatePaths(prefix, name);

  const path = paths[pathsNames.single];

  if (path === undefined) {
    return {};
  }

  const get = path.get;

  if (get === undefined) {
    return {};
  }

  return getPropertiesByOperation(get, 200);
}

function getPropertiesByOperation(
  operation: Operation,
  statusCode: number
): Schema {
  const response = operation.responses[statusCode] as Response;

  if (response === undefined) {
    return {};
  }

  if (response.content === undefined) {
    return {};
  }

  const content = response.content['application/json'] as MediaType;

  const schema = content.schema as any;

  if (schema === undefined) {
    return {};
  }

  // is Reference?
  if (schema.$ref !== undefined) {
    return {};
  }

  const schemaSchema = schema as Schema;

  if (schemaSchema.properties === undefined) {
    return {};
  }

  return schemaSchema.properties as {
    [property: string]: Schema;
  };
}
