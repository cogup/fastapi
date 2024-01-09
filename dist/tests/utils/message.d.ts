import { Model, SchemaModelsBuilder, Sequelize } from '../../src';
declare const sequelize: Sequelize;
declare class Message extends Model {
}
declare const schema: SchemaModelsBuilder;
export { Message, schema, sequelize };
