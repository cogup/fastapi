"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaBuilder = exports.AutoColumn = exports.TableBuilder = void 0;
const index_1 = require("./index");
class TableBuilder {
    name;
    columns = [];
    search = [];
    schema;
    builded = false;
    auto = [];
    group;
    constructor(props) {
        this.name = props.name;
        this.schema = props.schema;
        this.auto = props.auto;
        this.group = props.group;
    }
    column(column) {
        this.columns.push(column);
        return this;
    }
    searchColumn(column) {
        this.search.push(column);
        return this;
    }
    table(name) {
        this.build();
        return this.schema.table(name);
    }
    columnExists(name) {
        return this.columns.find((column) => column.name === name) !== undefined;
    }
    createdUpdated() {
        if (this.auto === undefined) {
            return;
        }
        if (this.auto.includes(AutoColumn.CREATED_AT) &&
            !this.columnExists('createdAt')) {
            this.column({
                name: 'createdAt',
                type: index_1.ColumnType.DATE,
                imutable: true
            });
        }
        if (this.auto.includes(AutoColumn.UPDATED_AT) &&
            !this.columnExists('updatedAt')) {
            this.column({
                name: 'updatedAt',
                type: index_1.ColumnType.DATE
            });
        }
        if (this.auto.includes(AutoColumn.ID) && !this.columnExists('id')) {
            this.column({
                name: 'id',
                type: index_1.ColumnType.INT,
                autoIncrement: true,
                primaryKey: true
            });
        }
    }
    build() {
        if (this.builded)
            return this;
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
exports.TableBuilder = TableBuilder;
var AutoColumn;
(function (AutoColumn) {
    AutoColumn[AutoColumn["ID"] = 0] = "ID";
    AutoColumn[AutoColumn["CREATED_AT"] = 1] = "CREATED_AT";
    AutoColumn[AutoColumn["UPDATED_AT"] = 2] = "UPDATED_AT";
})(AutoColumn || (exports.AutoColumn = AutoColumn = {}));
class SchemaBuilder {
    auto = [];
    schema = {
        tables: []
    };
    constructor(props = {}) {
        this.auto = props.auto || [];
    }
    table(table) {
        return new TableBuilder({
            name: table,
            schema: this,
            auto: this.auto
        });
    }
    build() {
        return this.schema;
    }
}
exports.SchemaBuilder = SchemaBuilder;
