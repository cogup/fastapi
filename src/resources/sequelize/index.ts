import { DataTypes, Model, Sequelize } from 'sequelize';
import { convertToSingle } from '../openapi/utils';
import { SchemaModelsBuilder, TableBuilder } from './builder';

function singularize(name: string): string {
  const lastPosition = name.length - 1;
  if (name.lastIndexOf('s') === lastPosition) {
    return name.slice(0, -1).toLocaleLowerCase();
  }

  return name.toLocaleLowerCase();
}

export type ResourceValues = string[] | undefined | number;

export type DataTypesResult =
  | DataTypes.StringDataType
  | DataTypes.NumberDataType
  | DataTypes.DateDataType
  | DataTypes.DataType;

export interface Schema {
  tables: Table[];
}

export interface Table {
  name: string;
  columns: Column[];
  filter?: string[];
  search?: string[];
  group?: string;
}

export enum ResourceType {
  STRING = 'string',
  CHAR = 'char',
  TEXT = 'text',
  DATE = 'date',
  TIME = 'time',
  BOOLEAN = 'boolean',
  UUID = 'uuid',
  ENUM = 'enum',
  JSON = 'json',
  INTEGER = 'integer',
  INT = 'int',
  FLOAT = 'float',
  CODE = 'code',
  NUMERIC = 'numeric',
  ARRAY = 'array'
}

export interface ResourceData {
  type?: ResourceType;
  autoIncrement?: boolean;
  values?: string[];
  min?: number;
  max?: number;
  immutable?: boolean;
  required?: boolean;
  private?: boolean;
  protected?: boolean;
  unique?: boolean;
  defaultValue?: any;
  reference?: string | TableBuilder;
  primaryKey?: boolean;
  allowNull?: boolean;
  search?: boolean;
  label?: string;
  maxLength?: number;
  binary?: boolean;
  length?: number;
  decimals?: number;
  description?: string;
  filter?: boolean;
  include?: typeof SequelizeModel;
}

export interface Column extends ResourceData {
  name: string;
}

export interface Relationship {
  model: typeof SequelizeModel;
  as: string;
}

export class SequelizeModel extends Model {}

export interface Resource {
  model: typeof SequelizeModel;
  name: string;
  primaryKey: string | null;
  columns: Record<string, Column>;
  search?: string[];
  filter?: string[];
  protectedColumns: string[];
  privateColumns: string[];
  noPropagateColumns: string[];
  group?: string;
  include: Relationship[];
}

export interface Resources {
  [resourceName: string]: Resource;
}

export interface SequelizeResources {
  model: typeof SequelizeModel;
  resources?: Record<string, ResourceData>;
}

export function generateResourcesFromSequelizeModels(
  sequelizeResources: SequelizeResources[] | SchemaModelsBuilder
) {
  if (sequelizeResources instanceof SchemaModelsBuilder) {
    sequelizeResources = sequelizeResources.schema;
  }

  const resources: Resources = {};

  for (const sequelizeResource of sequelizeResources) {
    const model = sequelizeResource.model;

    const resource: Resource = {
      model,
      name: model.name,
      primaryKey: null,
      columns: {},
      protectedColumns: [],
      privateColumns: [],
      noPropagateColumns: [],
      include: []
    };

    const attributes = model.getAttributes();

    for (const columnName of Object.keys(attributes)) {
      const attrType = attributes[columnName].type;
      const ResourceType = dataTypesResultToResourceType(attrType);
      const primaryKey = attributes[columnName].primaryKey ?? false;
      const allowNull = attributes[columnName].allowNull ?? false;
      const defaultValue = attributes[columnName].defaultValue;
      const unique = isUnique(attributes[columnName].unique);
      const columnResource =
        sequelizeResource.resources !== undefined
          ? columnName in sequelizeResource.resources
            ? sequelizeResource.resources[columnName]
            : {}
          : {};

      const { search, filter, ...attrs } = columnResource;

      resource.columns[columnName] = {
        type: ResourceType,
        primaryKey,
        allowNull,
        defaultValue,
        unique,
        ...attrs,
        name: columnName
      };

      const ResourceValues = dataTypesResultToResourceValues(attrType);
      if (ResourceValues !== undefined) {
        if (attrType instanceof DataTypes.ENUM) {
          resource.columns[columnName].values = ResourceValues as string[];
        } else if (attrType instanceof DataTypes.STRING) {
          resource.columns[columnName].maxLength = ResourceValues as number;
        }
      }

      if (search === true) {
        if (resource.search === undefined) {
          resource.search = [];
        }

        resource.search.push(columnName);
      }

      if (filter) {
        if (resource.filter === undefined) {
          resource.filter = [];
        }

        resource.filter.push(columnName);
      }

      if (primaryKey) {
        resource.primaryKey = columnName;
      }

      if (resource.columns[columnName].include !== undefined) {
        resource.include.push({
          model: resource.columns[columnName].include as typeof SequelizeModel,
          as: singularize(
            (
              resource.columns[columnName].include?.getTableName() as string
            ).toLowerCase()
          )
        });
      }
    }

    resources[model.name] = resource;
  }

  return resources;
}

export function getReference(reference: string | TableBuilder): string {
  if (typeof reference === 'string') {
    return reference;
  }

  return reference.name;
}

function isUnique(
  data:
    | string
    | boolean
    | {
        name: string;
        msg: string;
      }
    | undefined
): boolean {
  if (typeof data === 'boolean' && data === true) {
    return data;
  }

  if (typeof data === 'object') {
    return true;
  }

  return false;
}

export function generateResourcesFromJSON(
  jsonSchema: Schema,
  sequelize: Sequelize
): Resources {
  const resources: Resources = {};

  for (const table of jsonSchema.tables) {
    const tableColumns: Record<string, any> = {};
    const tableName = getTableName(table.name);
    const singleName = convertToSingle(tableName);
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
      filter: table.filter,
      name: table.name,
      group: table.group,
      privateColumns,
      protectedColumns,
      noPropagateColumns: [...privateColumns, ...protectedColumns]
    } as Resource;

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

    class DynamicTable extends Model {}

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

function getResourceName(name: string): string {
  // se terminar com s, remove o s
  const lastPosition = name.length - 1;
  if (name.lastIndexOf('s') !== lastPosition) {
    return name.slice(0, -1).toLocaleLowerCase();
  }

  return name.toLocaleLowerCase();
}

function getTableName(name: string): string {
  return name.toLowerCase();
}

function getNumberProps(attributes: Record<string, any>): Record<string, any> {
  const params: Record<string, any> = {};

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

function dataTypesResultToResourceType(data: DataTypesResult): ResourceType {
  if (data instanceof DataTypes.STRING) {
    return ResourceType.STRING;
  } else if (data instanceof DataTypes.CHAR) {
    return ResourceType.CHAR;
  } else if (data instanceof DataTypes.TEXT) {
    return ResourceType.TEXT;
  } else if (data instanceof DataTypes.DATE) {
    return ResourceType.DATE;
  } else if (data instanceof DataTypes.TIME) {
    return ResourceType.TIME;
  } else if (data instanceof DataTypes.BOOLEAN) {
    return ResourceType.BOOLEAN;
  } else if (data instanceof DataTypes.UUID) {
    return ResourceType.UUID;
  } else if (data instanceof DataTypes.ENUM) {
    return ResourceType.ENUM;
  } else if (data instanceof DataTypes.JSON) {
    return ResourceType.JSON;
  } else if (data instanceof DataTypes.INTEGER) {
    return ResourceType.INTEGER;
  } else if (data instanceof DataTypes.FLOAT) {
    return ResourceType.FLOAT;
  } else if (data instanceof DataTypes.NUMBER) {
    return ResourceType.NUMERIC;
  } else if (data instanceof DataTypes.ARRAY) {
    return ResourceType.ARRAY;
  }

  throw new Error(`Unknown column type: ${data}`);
}

function dataTypesResultToResourceValues(
  data: DataTypesResult
): ResourceValues {
  if (data instanceof DataTypes.ENUM) {
    const dataEnum = data as any;
    return dataEnum.values;
  } else if (data instanceof DataTypes.STRING) {
    const dataString = data as any;
    return dataString.options?.length;
  }

  return undefined;
}

function getSequelizeDataType(column: Column): DataTypesResult {
  const { type, ...attributes } = column;

  const ResourceType = type?.toUpperCase() as string;

  if (
    (ResourceType.includes('TEXT') || ResourceType.includes('VARCHAR')) &&
    attributes.maxLength
  ) {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  } else if (ResourceType === 'STRING') {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  } else if (ResourceType === 'CHAR') {
    return DataTypes.CHAR(attributes.maxLength, attributes.binary);
  } else if (ResourceType === 'TEXT') {
    return DataTypes.TEXT;
  } else if (ResourceType === 'DATE') {
    return DataTypes.DATE(attributes.maxLength);
  } else if (ResourceType === 'TIME') {
    return DataTypes.TIME;
  } else if (ResourceType === 'BOOLEAN') {
    return DataTypes.BOOLEAN;
  } else if (ResourceType === 'UUID') {
    return DataTypes.UUID;
  } else if (ResourceType === 'ENUM') {
    const values = attributes.values as [];
    return DataTypes.ENUM.apply(null, values);
  } else if (ResourceType === 'JSON' || ResourceType === 'JSONTYPE') {
    return DataTypes.JSON;
  } else if (
    ResourceType === 'INT' ||
    ResourceType === 'INTEGER' ||
    ResourceType === 'SERIAL'
  ) {
    return DataTypes.INTEGER;
  } else if (ResourceType === 'FLOAT') {
    return DataTypes.FLOAT(attributes.length, attributes.decimals);
  } else if (
    ResourceType === 'BIGINT' ||
    ResourceType === 'SMALLINT' ||
    ResourceType === 'TINYINT' ||
    ResourceType === 'MEDIUMINT' ||
    ResourceType === 'DOUBLE' ||
    ResourceType === 'DECIMAL' ||
    ResourceType === 'REAL' ||
    ResourceType === 'NUMERIC'
  ) {
    return DataTypes.NUMBER(getNumberProps(attributes));
  } else if (ResourceType === 'CODE') {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  } else if (ResourceType === 'INTEGER[]') {
    return DataTypes.ARRAY(DataTypes.INTEGER);
  }

  throw new Error(`Unknown column type: ${ResourceType}`);
}
