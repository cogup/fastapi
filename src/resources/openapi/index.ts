import { Resource } from '../sequelize';
import { convertType } from './dataTypes';
import {
  AdminData,
  AdminReferences,
  OpenAPI,
  Properties
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
  imutable?: boolean;
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
    const imutable = value.imutable;

    delete value.imutable;

    if (removeOnlyAllProp && imutable) {
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

export function generateOpenapiSchemas(
  resource: Resource,
  tags: Tags
): OpenAPI {
  const { model, columns, search, name, group } = resource;
  const resourceName = name.toLowerCase();
  const groupName = group !== undefined ? group.toLowerCase() : convertToSingle(name);
  const pluralName = convertToPlural(resourceName);

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

    if ('imutable' in column) {
      property.imutable = column.imutable;
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
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
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
      [`/api/${pluralName}`]: {
        get: {
          types: (() => {
            if (search && search.length > 0) {
              return ['list', 'search'];
            } else {
              return ['list'];
            }
          })(),
          references: (() => {
            const references: AdminReferences = {
              list: {
                query: {
                  searchTerm: 'search'
                }
              }
            };

            if (search && search.length > 0) {
              references.search = {
                query: {
                  searchTerm: 'search'
                }
              };
            }

            return references;
          })()
        },
        post: {
          types: ['create'],
        }
      },
      [`/api/${pluralName}/{id}`]: {
        get: {
          types: ['read'],
        },
        put: {
          types: ['update'],
        },
        delete: {
          types: ['delete'],
        }
      }
    }
  };

  return {
    'x-admin': adminData,
    paths: {
      [`/api/${pluralName}`]: {
        get: {
          summary: `List ${groupName}`,
          description: `List and search ${groupName}`,
          tags: resolveTags(groupName, tags.list),
          parameters: [
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
              name: 'pageSize',
              in: 'query',
              description: 'Number of items per page',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100
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
      [`/api/${pluralName}/{id}`]: {
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
