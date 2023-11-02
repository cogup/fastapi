import { DataTypes, Model, Sequelize } from 'sequelize';
import { SchemaModelsBuilder, TableBuilder } from './builder';
export type DataTypesResult = DataTypes.StringDataType | DataTypes.NumberDataType | DataTypes.DateDataType | DataTypes.DataType;
export interface Schema {
    tables: Table[];
}
export interface Table {
    name: string;
    columns: Column[];
    search?: string[];
    group?: string;
}
export declare enum ResourceType {
    STRING = "string",
    CHAR = "char",
    TEXT = "text",
    DATE = "date",
    TIME = "time",
    BOOLEAN = "boolean",
    UUID = "uuid",
    ENUM = "enum",
    JSON = "json",
    INTEGER = "integer",
    INT = "int",
    FLOAT = "float",
    CODE = "code",
    NUMERIC = "numeric"
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
}
export interface Column extends ResourceData {
    name: string;
}
export interface Relationship {
    model: typeof SequelizeModel;
    as: string;
}
export declare class SequelizeModel extends Model {
}
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
    [resourceName: string]: Resource;
}
export interface SequelizeResources {
    model: typeof SequelizeModel;
    resources?: Record<string, ResourceData>;
}
export declare function generateResourcesFromSequelizeModels(sequelizeResources: SequelizeResources[] | SchemaModelsBuilder): Resources;
export declare function getReference(reference: string | TableBuilder): string;
export declare function generateResourcesFromJSON(jsonSchema: Schema, sequelize: Sequelize): Resources;
