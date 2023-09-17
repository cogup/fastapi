import { Column, ResourceData, Schema, SequelizeModel, SequelizeResources } from './index';
export interface TableBuilderProps {
    name: string;
    schema: SchemaBuilder;
    auto?: AutoColumn[];
    group?: string;
}
export declare class TableBuilder {
    name: string;
    columns: any[];
    search: string[];
    schema: SchemaBuilder;
    private builded;
    auto?: AutoColumn[];
    group?: string;
    constructor(props: TableBuilderProps);
    column(column: Column): TableBuilder;
    searchColumn(column: string): TableBuilder;
    table(name: string): TableBuilder;
    private columnExists;
    private createdUpdated;
    build(): this;
}
export interface SchemaBuilderProps {
    auto?: AutoColumn[];
    updated?: boolean;
}
export declare enum AutoColumn {
    ID = 0,
    CREATED_AT = 1,
    UPDATED_AT = 2
}
export declare class SchemaBuilder {
    auto: AutoColumn[];
    schema: Schema;
    constructor(props?: SchemaBuilderProps);
    table(table: string): TableBuilder;
    build(): Schema;
}
export declare class SchemaModelsBuilder {
    schema: SequelizeResources[];
    constructor();
    addResource(model: typeof SequelizeModel, resources?: Record<string, ResourceData>): void;
}
