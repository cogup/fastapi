import { DataTypes, Model, Sequelize } from 'sequelize';
import { convertToSingle } from '../openapi/utils';
import { TableBuilder } from './builder';

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
  search?: string[];
  group?: string;
}

export enum ColumnType {
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
  SERIAL = 'int',
  FLOAT = 'float',
  CODE = 'code',
  NUMERIC = 'numeric'
}

export interface ResourceData {
  type?: ColumnType;
  autoIncrement?: boolean;
  values?: string[];
  min?: number;
  max?: number;
  imutable?: boolean;
  required?: boolean;
  private?: boolean;
  protected?: boolean;
  unique?: boolean;
  defaultValue?: any;
  reference?: string | TableBuilder;
  primaryKey?: boolean;
  allowNull?: boolean;
  search?: string[];
  label?: string;
  maxLength?: number;
  binary?: boolean;
  length?: number;
  decimals?: number;
  description?: string;
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
  protectedColumns: string[];
  privateColumns: string[];
  noPropagateColumns: string[];
  group?: string;
}

export interface Resources {
  [resurceName: string]: Resource;
}

export interface SequelizeResources {
  model: typeof SequelizeModel;
  resources?: Record<string, ResourceData>;
}

export function generateResourcesFromSequelizeModels(
  sequelizeResources: SequelizeResources[]
) {
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
      noPropagateColumns: []
    };

    const attributes = model.getAttributes();

    for (const column of Object.keys(attributes)) {
      const columnType = dataTypesResultToColumnType(attributes[column].type);
      const primaryKey = attributes[column].primaryKey ?? false;
      const allowNull = attributes[column].allowNull ?? false;
      const defaultValue = attributes[column].defaultValue;
      const unique = isUnique(attributes[column].unique);
      const columnResource =
        sequelizeResource.resources !== undefined
          ? column in sequelizeResource.resources
            ? sequelizeResource.resources[column]
            : {}
          : {};

      resource.columns[column] = {
        type: columnType,
        primaryKey,
        allowNull,
        defaultValue,
        unique,
        ...columnResource,
        name: column,
      };

      if (primaryKey) {
        resource.primaryKey = column;
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
    const resurceName = getResourceName(table.name);
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
    } as Resource;

    for (const column of table.columns) {
      const columnName = column.name;
      const columnType = getSequelizeDataType(column);

      const primaryKey = column.primaryKey ?? false;
      const allowNull = column.allowNull ?? false;
      const defaultValue = column.defaultValue;
      const unique = column.unique ?? false;

      column.required = !allowNull || column.required;

      tableColumns[columnName] = {
        type: columnType,
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

    resources[resurceName] = resource;
  }

  // Configurar as associações entre os modelos
  for (const table of jsonSchema.tables) {
    const resurceName = getResourceName(table.name);
    const model = resources[resurceName].model;

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

function dataTypesResultToColumnType(data: DataTypesResult): ColumnType {
  if (data instanceof DataTypes.STRING) {
    return ColumnType.STRING;
  } else if (data instanceof DataTypes.CHAR) {
    return ColumnType.CHAR;
  } else if (data instanceof DataTypes.TEXT) {
    return ColumnType.TEXT;
  } else if (data instanceof DataTypes.DATE) {
    return ColumnType.DATE;
  } else if (data instanceof DataTypes.TIME) {
    return ColumnType.TIME;
  } else if (data instanceof DataTypes.BOOLEAN) {
    return ColumnType.BOOLEAN;
  } else if (data instanceof DataTypes.UUID) {
    return ColumnType.UUID;
  } else if (data instanceof DataTypes.ENUM) {
    return ColumnType.ENUM;
  } else if (data instanceof DataTypes.JSON) {
    return ColumnType.JSON;
  } else if (data instanceof DataTypes.INTEGER) {
    return ColumnType.INTEGER;
  } else if (data instanceof DataTypes.FLOAT) {
    return ColumnType.FLOAT;
  } else if (data instanceof DataTypes.NUMBER) {
    return ColumnType.NUMERIC;
  }

  throw new Error(`Unknown column type: ${data}`);
}

function getSequelizeDataType(column: Column): DataTypesResult {
  const { type, ...attributes } = column;

  const columnType = type?.toUpperCase() as string;

  if (
    (columnType.includes('TEXT') || columnType.includes('VARCHAR')) &&
    attributes.maxLength
  ) {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  } else if (columnType === 'STRING') {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  } else if (columnType === 'CHAR') {
    return DataTypes.CHAR(attributes.maxLength, attributes.binary);
  } else if (columnType === 'TEXT') {
    return DataTypes.TEXT;
  } else if (columnType === 'DATE') {
    return DataTypes.DATE(attributes.maxLength);
  } else if (columnType === 'TIME') {
    return DataTypes.TIME;
  } else if (columnType === 'BOOLEAN') {
    return DataTypes.BOOLEAN;
  } else if (columnType === 'UUID') {
    return DataTypes.UUID;
  } else if (columnType === 'ENUM') {
    const values = attributes.values as [];
    return DataTypes.ENUM.apply(null, values);
  } else if (columnType === 'JSON' || columnType === 'JSONTYPE') {
    return DataTypes.JSON;
  } else if (
    columnType === 'INT' ||
    columnType === 'INTEGER' ||
    columnType === 'SERIAL'
  ) {
    return DataTypes.INTEGER;
  } else if (columnType === 'FLOAT') {
    return DataTypes.FLOAT(attributes.length, attributes.decimals);
  } else if (
    columnType === 'BIGINT' ||
    columnType === 'SMALLINT' ||
    columnType === 'TINYINT' ||
    columnType === 'MEDIUMINT' ||
    columnType === 'DOUBLE' ||
    columnType === 'DECIMAL' ||
    columnType === 'REAL' ||
    columnType === 'NUMERIC'
  ) {
    return DataTypes.NUMBER(getNumberProps(attributes));
  } else if (columnType === 'CODE') {
    return DataTypes.STRING(attributes.maxLength, attributes.binary);
  }

  throw new Error(`Unknown column type: ${columnType}`);
}
