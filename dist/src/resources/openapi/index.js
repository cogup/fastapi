"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertIncludeOnOpenAPISchemas = exports.generateOpenAPISchemas = exports.generatePaths = void 0;
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
        const immutable = value.immutable;
        delete value.immutable;
        if (removeOnlyAllProp && immutable) {
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
function generatePaths(prefix, name) {
    const resourceName = name.toLowerCase();
    const pluralName = (0, utils_1.convertToPlural)(resourceName);
    return {
        many: `${prefix}/${pluralName}`,
        single: `${prefix}/${pluralName}/{id}`
    };
}
exports.generatePaths = generatePaths;
function generateOpenAPISchemas(resource, tags, prefix) {
    const { model, columns, search, name, group } = resource;
    const groupName = group !== undefined ? group.toLowerCase() : (0, utils_1.convertToSingle)(name);
    group !== undefined ? group.toLowerCase() : (0, utils_1.convertToSingle)(name);
    const handlerPaths = generatePaths(prefix, name);
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
                    offset: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
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
            [handlerPaths.many]: {
                get: {
                    types: (() => {
                        if (search && search.length > 0) {
                            return ['list', 'search'];
                        }
                        else {
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
exports.generateOpenAPISchemas = generateOpenAPISchemas;
// copy schemas on includes
function insertIncludeOnOpenAPISchemas(paths, resources, prefix) {
    const newPaths = { ...paths };
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
        const propertiesAll = getPropertiesByOperation(getAll, 200);
        const getAllProperties = {
            ...propertiesAll.data.items.properties
        };
        const getOneProperties = getPropertiesByOperation(getOne, 200);
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
        });
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
        });
        include.forEach((include) => {
            const includeProperties = getIncludeProperties(include.model.name, paths, resources, prefix);
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
        const newGetAll = resolveNewOperation(getAll, {
            ...propertiesAll,
            data: {
                ...propertiesAll.data,
                items: {
                    ...propertiesAll.data.items,
                    properties: getAllProperties
                }
            }
        }, 200);
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
exports.insertIncludeOnOpenAPISchemas = insertIncludeOnOpenAPISchemas;
function resolveNewOperation(operator, properties, statusCode) {
    const responseOkRaw = operator.responses[statusCode];
    const responseOkContent = responseOkRaw.content;
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
    };
    return newOperator;
}
function getIncludeProperties(target, paths, resources, prefix) {
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
function getPropertiesByOperation(operation, statusCode) {
    const response = operation.responses[statusCode];
    if (response === undefined) {
        return {};
    }
    if (response.content === undefined) {
        return {};
    }
    const content = response.content['application/json'];
    const schema = content.schema;
    if (schema === undefined) {
        return {};
    }
    // is Reference?
    if (schema.$ref !== undefined) {
        return {};
    }
    const schemaSchema = schema;
    if (schemaSchema.properties === undefined) {
        return {};
    }
    return schemaSchema.properties;
}
