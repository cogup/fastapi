import { Model, SchemaModelsBuilder, Sequelize } from '../../src';
declare const sequelize: Sequelize;
declare class Author extends Model {
}
declare class Message extends Model {
}
declare const schema: SchemaModelsBuilder;
export { Message, Author, schema, sequelize };
