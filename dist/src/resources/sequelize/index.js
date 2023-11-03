"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResourcesFromJSON = exports.getReference = exports.generateResourcesFromSequelizeModels = exports.SequelizeModel = exports.ResourceType = void 0;
const sequelize_1 = require("sequelize");
const utils_1 = require("../openapi/utils");
const builder_1 = require("./builder");
var ResourceType;
(function (ResourceType) {
    ResourceType["STRING"] = "string";
    ResourceType["CHAR"] = "char";
    ResourceType["TEXT"] = "text";
    ResourceType["DATE"] = "date";
    ResourceType["TIME"] = "time";
    ResourceType["BOOLEAN"] = "boolean";
    ResourceType["UUID"] = "uuid";
    ResourceType["ENUM"] = "enum";
    ResourceType["JSON"] = "json";
    ResourceType["INTEGER"] = "integer";
    ResourceType["INT"] = "int";
    ResourceType["FLOAT"] = "float";
    ResourceType["CODE"] = "code";
    ResourceType["NUMERIC"] = "numeric";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
class SequelizeModel extends sequelize_1.Model {
}
exports.SequelizeModel = SequelizeModel;
function generateResourcesFromSequelizeModels(sequelizeResources) {
    if (sequelizeResources instanceof builder_1.SchemaModelsBuilder) {
        sequelizeResources = sequelizeResources.schema;
    }
    const resources = {};
    for (const sequelizeResource of sequelizeResources) {
        const model = sequelizeResource.model;
        const resource = {
            model,
            name: model.name,
            primaryKey: null,
            columns: {},
            protectedColumns: [],
            privateColumns: [],
            noPropagateColumns: []
        };
        const attributes = model.getAttributes();
        for (const columnName of Object.keys(attributes)) {
            const ResourceType = dataTypesResultToResourceType(attributes[columnName].type);
            const primaryKey = attributes[columnName].primaryKey ?? false;
            const allowNull = attributes[columnName].allowNull ?? false;
            const defaultValue = attributes[columnName].defaultValue;
            const unique = isUnique(attributes[columnName].unique);
            const columnResource = sequelizeResource.resources !== undefined
                ? columnName in sequelizeResource.resources
                    ? sequelizeResource.resources[columnName]
                    : {}
                : {};
            const { search, ...attrs } = columnResource;
            resource.columns[columnName] = {
                type: ResourceType,
                primaryKey,
                allowNull,
                defaultValue,
                unique,
                ...attrs,
                name: columnName
            };
            if (search === true) {
                if (resource.search === undefined) {
                    resource.search = [];
                }
                resource.search.push(columnName);
            }
            if (primaryKey) {
                resource.primaryKey = columnName;
            }
        }
        resources[model.name] = resource;
    }
    return resources;
}
exports.generateResourcesFromSequelizeModels = generateResourcesFromSequelizeModels;
function getReference(reference) {
    if (typeof reference === 'string') {
        return reference;
    }
    return reference.name;
}
exports.getReference = getReference;
function isUnique(data) {
    if (typeof data === 'boolean' && data === true) {
        return data;
    }
    if (typeof data === 'object') {
        return true;
    }
    return false;
}
function generateResourcesFromJSON(jsonSchema, sequelize) {
    const resources = {};
    for (const table of jsonSchema.tables) {
        const tableColumns = {};
        const tableName = getTableName(table.name);
        const singleName = (0, utils_1.convertToSingle)(tableName);
        const resourceName = getResourceName(table.name);
        const privateColumns = table.columns
            .filter((column) => column.private)
            .map((column) => column.name);
        const protectedColumns = table.columns
            .filter((column) => column.protected)
            .map((column) => column.name);
        const resource = {
            primaryKey: null,
            columns: {},
            search: table.search,
            name: table.name,
            group: table.group,
            privateColumns,
            protectedColumns,
            noPropagateColumns: [...privateColumns, ...protectedColumns]
        };
        for (const column of table.columns) {
            const columnName = column.name;
            const ResourceType = getSequelizeDataType(column);
            const primaryKey = column.primaryKey ?? false;
            const allowNull = column.allowNull ?? false;
            const defaultValue = column.defaultValue;
            const unique = column.unique ?? false;
            column.required = !allowNull || column.required;
            tableColumns[columnName] = {
                type: ResourceType,
                allowNull,
                primaryKey,
                references: null,
                autoIncrement: column.autoIncrement || false,
                defaultValue,
                unique
            };
            if (primaryKey) {
                resource.primaryKey = columnName;
            }
            resource.columns[columnName] = column;
        }
        class DynamicTable extends sequelize_1.Model {
        }
        DynamicTable.init(tableColumns, {
            sequelize,
            modelName: singleName
        });
        resource.model = DynamicTable;
        resources[resourceName] = resource;
    }
    // Configurar as associações entre os modelos
    for (const table of jsonSchema.tables) {
        const resourceName = getResourceName(table.name);
        const model = resources[resourceName].model;
        for (const column of table.columns) {
            if (!column.reference) {
                continue;
            }
            const tableName = getTableName(getReference(column.reference));
            const referencedTable = getResourceName(tableName);
            const referencedModel = resources[referencedTable].model;
            model.belongsTo(referencedModel, { foreignKey: column.name });
            referencedModel.hasMany(model, { foreignKey: column.name });
        }
    }
    return resources;
}
exports.generateResourcesFromJSON = generateResourcesFromJSON;
function getResourceName(name) {
    // se terminar com s, remove o s
    const lastPosition = name.length - 1;
    if (name.lastIndexOf('s') !== lastPosition) {
        return name.slice(0, -1).toLocaleLowerCase();
    }
    return name.toLocaleLowerCase();
}
function getTableName(name) {
    return name.toLowerCase();
}
function getNumberProps(attributes) {
    const params = {};
    if (attributes.length) {
        params.length = attributes.length;
    }
    if (attributes.precision) {
        params.precision = attributes.precision;
    }
    if (attributes.scale) {
        params.scale = attributes.scale;
    }
    if (attributes.unsigned) {
        params.unsigned = attributes.unsigned;
    }
    if (attributes.zerofill) {
        params.zerofill = attributes.zerofill;
    }
    if (attributes.decimals) {
        params.decimals = attributes.decimals;
    }
    return params;
}
function dataTypesResultToResourceType(data) {
    if (data instanceof sequelize_1.DataTypes.STRING) {
        return ResourceType.STRING;
    }
    else if (data instanceof sequelize_1.DataTypes.CHAR) {
        return ResourceType.CHAR;
    }
    else if (data instanceof sequelize_1.DataTypes.TEXT) {
        return ResourceType.TEXT;
    }
    else if (data instanceof sequelize_1.DataTypes.DATE) {
        return ResourceType.DATE;
    }
    else if (data instanceof sequelize_1.DataTypes.TIME) {
        return ResourceType.TIME;
    }
    else if (data instanceof sequelize_1.DataTypes.BOOLEAN) {
        return ResourceType.BOOLEAN;
    }
    else if (data instanceof sequelize_1.DataTypes.UUID) {
        return ResourceType.UUID;
    }
    else if (data instanceof sequelize_1.DataTypes.ENUM) {
        return ResourceType.ENUM;
    }
    else if (data instanceof sequelize_1.DataTypes.JSON) {
        return ResourceType.JSON;
    }
    else if (data instanceof sequelize_1.DataTypes.INTEGER) {
        return ResourceType.INTEGER;
    }
    else if (data instanceof sequelize_1.DataTypes.FLOAT) {
        return ResourceType.FLOAT;
    }
    else if (data instanceof sequelize_1.DataTypes.NUMBER) {
        return ResourceType.NUMERIC;
    }
    throw new Error(`Unknown column type: ${data}`);
}
function getSequelizeDataType(column) {
    const { type, ...attributes } = column;
    const ResourceType = type?.toUpperCase();
    if ((ResourceType.includes('TEXT') || ResourceType.includes('VARCHAR')) &&
        attributes.maxLength) {
        return sequelize_1.DataTypes.STRING(attributes.maxLength, attributes.binary);
    }
    else if (ResourceType === 'STRING') {
        return sequelize_1.DataTypes.STRING(attributes.maxLength, attributes.binary);
    }
    else if (ResourceType === 'CHAR') {
        return sequelize_1.DataTypes.CHAR(attributes.maxLength, attributes.binary);
    }
    else if (ResourceType === 'TEXT') {
        return sequelize_1.DataTypes.TEXT;
    }
    else if (ResourceType === 'DATE') {
        return sequelize_1.DataTypes.DATE(attributes.maxLength);
    }
    else if (ResourceType === 'TIME') {
        return sequelize_1.DataTypes.TIME;
    }
    else if (ResourceType === 'BOOLEAN') {
        return sequelize_1.DataTypes.BOOLEAN;
    }
    else if (ResourceType === 'UUID') {
        return sequelize_1.DataTypes.UUID;
    }
    else if (ResourceType === 'ENUM') {
        const values = attributes.values;
        return sequelize_1.DataTypes.ENUM.apply(null, values);
    }
    else if (ResourceType === 'JSON' || ResourceType === 'JSONTYPE') {
        return sequelize_1.DataTypes.JSON;
    }
    else if (ResourceType === 'INT' ||
        ResourceType === 'INTEGER' ||
        ResourceType === 'SERIAL') {
        return sequelize_1.DataTypes.INTEGER;
    }
    else if (ResourceType === 'FLOAT') {
        return sequelize_1.DataTypes.FLOAT(attributes.length, attributes.decimals);
    }
    else if (ResourceType === 'BIGINT' ||
        ResourceType === 'SMALLINT' ||
        ResourceType === 'TINYINT' ||
        ResourceType === 'MEDIUMINT' ||
        ResourceType === 'DOUBLE' ||
        ResourceType === 'DECIMAL' ||
        ResourceType === 'REAL' ||
        ResourceType === 'NUMERIC') {
        return sequelize_1.DataTypes.NUMBER(getNumberProps(attributes));
    }
    else if (ResourceType === 'CODE') {
        return sequelize_1.DataTypes.STRING(attributes.maxLength, attributes.binary);
    }
    else if (ResourceType === 'INTEGER[]') {
        return sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.INTEGER);
    }
    throw new Error(`Unknown column type: ${ResourceType}`);
}
