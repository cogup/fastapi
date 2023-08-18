"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenapiSchemas = void 0;
const dataTypes_1 = require("./dataTypes");
const responses_1 = require("./responses");
const utils_1 = require("./utils");
const resolveTags = (name, tags = []) => {
    const resourceName = name.toLowerCase();
    return tags.map((tag) => {
        if (tag.indexOf('$name') > -1) {
            return tag.replace('$name', resourceName);
        }
        return tag;
    });
};
const removeImutable = (properties, removeOnlyAllProp = false) => {
    const newProperties = {};
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
const removeProtected = (props) => {
    const newProperties = {};
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
function generateOpenapiSchemas(resource, tags) {
    const { model, columns, search, name } = resource;
    const resourceName = name.toLowerCase();
    const singleName = (0, utils_1.convertToSingle)(name);
    const pluralName = (0, utils_1.convertToPlural)(resourceName);
    const groupName = singleName.charAt(0).toUpperCase() + singleName.slice(1);
    const attributeKeys = Object.keys(model.getAttributes());
    const properties = {};
    const required = [];
    attributeKeys.forEach((key) => {
        const column = columns[key];
        if (column.private) {
            return;
        }
        const attribute = model.getAttributes()[key];
        const propertyType = (0, dataTypes_1.convertType)(attribute.type.constructor.name);
        const property = {
            ...propertyType,
            description: ''
        };
        if (property.type === 'string' &&
            'maxLength' in column &&
            column.maxLength !== undefined) {
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
    const makeAllResponseProperties = (props) => {
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
    const makeCreateProperties = (prop) => {
        const postProperties = { ...prop };
        delete postProperties.id;
        delete postProperties.createdAt;
        delete postProperties.updatedAt;
        return removeImutable(postProperties, true);
    };
    const getOrderByEnumValues = () => {
        const sortFields = Object.keys(properties);
        return sortFields.map((field) => field.startsWith('-') ? field.substring(1) : field);
    };
    const createProperties = makeCreateProperties(properties);
    const updateProperties = createProperties;
    const responseProperties = removeProtected(removeImutable(properties, false));
    const responseResolvedPost = (0, responses_1.makeResponses)(name, 201, responseProperties, true);
    const responseResolvedDelete = (0, responses_1.makeResponses)(name, 204, responseProperties);
    const responseResolvedGet = (0, responses_1.makeResponses)(name, 200, responseProperties);
    const responseResolvedPut = responseResolvedGet;
    const responseResolvedList = (0, responses_1.makeResponses)(name, 200, makeAllResponseProperties(responseProperties));
    const adminData = {
        resources: {
            [`/api/${pluralName}`]: {
                get: {
                    types: (() => {
                        if (search && search.length > 0) {
                            return ['list', 'search'];
                        }
                        else {
                            return ['list'];
                        }
                    })(),
                    groupName,
                    resourceName: 'List',
                    references: (() => {
                        const references = {
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
                    groupName,
                    resourceName: 'Create'
                }
            },
            [`/api/${pluralName}/{id}`]: {
                get: {
                    types: ['read'],
                    groupName,
                    resourceName: 'Read'
                },
                put: {
                    types: ['update'],
                    groupName,
                    resourceName: 'Update'
                },
                delete: {
                    types: ['delete'],
                    groupName,
                    resourceName: 'Delete'
                }
            }
        }
    };
    return {
        'x-admin': adminData,
        paths: {
            [`/api/${pluralName}`]: {
                get: {
                    summary: `List ${name}`,
                    description: `List and search ${name}`,
                    tags: resolveTags(name, tags.list),
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
                    summary: `Create ${name}`,
                    description: `Create ${name}`,
                    tags: resolveTags(name, tags.create),
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
                    summary: `Get ${name} by ID`,
                    description: `Get ${name} by ID`,
                    tags: resolveTags(name, tags.read),
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: `${name} ID`,
                            schema: {
                                type: 'integer'
                            },
                            required: true
                        }
                    ],
                    responses: responseResolvedGet
                },
                put: {
                    summary: `Update ${name}`,
                    description: `Update ${name}`,
                    tags: resolveTags(name, tags.update),
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: `${name} ID`,
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
                    summary: `Delete ${name}`,
                    description: `Delete ${name}`,
                    tags: resolveTags(name, tags.delete),
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: `${name} ID`,
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
exports.generateOpenapiSchemas = generateOpenapiSchemas;
