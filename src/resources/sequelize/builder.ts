import { Model } from 'sequelize';
import { Column, ResourceType, ResourceData, Schema, SequelizeModel, SequelizeResources } from './index';

export interface TableBuilderProps {
  name: string;
  schema: SchemaBuilder;
  auto?: AutoColumn[];
  group?: string;
}

export class TableBuilder {
  name: string;
  columns: any[] = [];
  search: string[] = [];
  schema: SchemaBuilder;
  private builded: boolean = false;
  auto?: AutoColumn[] = [];
  group?: string;

  constructor(props: TableBuilderProps) {
    this.name = props.name;
    this.schema = props.schema;
    this.auto = props.auto;
    this.group = props.group;
  }

  column(column: Column): TableBuilder {
    this.columns.push(column);
    return this;
  }

  searchColumn(column: string): TableBuilder {
    this.search.push(column);
    return this;
  }

  table(name: string) {
    this.build();
    return this.schema.table(name);
  }

  private columnExists(name: string): boolean {
    return this.columns.find((column) => column.name === name) !== undefined;
  }

  private createdUpdated(): void {
    const auto = this.auto || this.schema.auto;

    if (auto === undefined) {
      return;
    }

    if (
      auto.includes(AutoColumn.CREATED_AT) &&
      !this.columnExists('createdAt')
    ) {
      this.column({
        name: 'createdAt',
        type: ResourceType.DATE,
        imutable: true
      });
    }

    if (
      auto.includes(AutoColumn.UPDATED_AT) &&
      !this.columnExists('updatedAt')
    ) {
      this.column({
        name: 'updatedAt',
        type: ResourceType.DATE
      });
    }

    if (auto.includes(AutoColumn.ID) && !this.columnExists('id')) {
      this.column({
        name: 'id',
        type: ResourceType.INT,
        autoIncrement: true,
        primaryKey: true
      });
    }
  }

  build(): this {
    if (this.builded) return this;
    this.createdUpdated();

    this.builded = true;
    this.schema.schema.tables.push({
      name: this.name,
      columns: this.columns,
      search: this.search,
      group: this.group
    });

    return this;
  }
}

export interface SchemaBuilderProps {
  auto?: AutoColumn[];
  updated?: boolean;
}

export enum AutoColumn {
  ID,
  CREATED_AT,
  UPDATED_AT
}

export class SchemaBuilder {
  auto: AutoColumn[] = [];
  schema: Schema = {
    tables: []
  };

  constructor(props: SchemaBuilderProps = {}) {
    this.auto = props.auto || [];
  }

  table(table: string): TableBuilder {
    return new TableBuilder({
      name: table,
      schema: this,
      auto: this.auto
    });
  }

  build(): Schema {
    return this.schema;
  }
}

export class SchemaModelsBuilder {
  schema: SequelizeResources[];

  constructor() {
    this.schema = [];
  }

  addResource(
    model: typeof SequelizeModel,
    resources?: Record<string, ResourceData>
  ) {
    this.schema.push({
      model,
      resources
    });
  }
}
