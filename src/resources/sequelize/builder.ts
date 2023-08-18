import { Column, ColumnType, Schema } from './index';

export interface TableBuilderProps {
  name: string;
  schema: SchemaBuilder;
  auto: AutoColumn[];
}

export class TableBuilder {
  name: string;
  columns: any[] = [];
  search: string[] = [];
  schema: SchemaBuilder;
  private builded: boolean = false;
  auto: AutoColumn[] = [];

  constructor(props: TableBuilderProps) {
    this.name = props.name;
    this.schema = props.schema;
    this.auto = props.auto;
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
    if (
      this.auto.includes(AutoColumn.CREATED_AT) &&
      !this.columnExists('createdAt')
    ) {
      this.column({
        name: 'createdAt',
        type: ColumnType.DATE,
        imutable: true
      });
    }

    if (
      this.auto.includes(AutoColumn.UPDATED_AT) &&
      !this.columnExists('updatedAt')
    ) {
      this.column({
        name: 'updatedAt',
        type: ColumnType.DATE
      });
    }

    if (this.auto.includes(AutoColumn.ID) && !this.columnExists('id')) {
      this.column({
        name: 'id',
        type: ColumnType.INT,
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
      search: this.search
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
