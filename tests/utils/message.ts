import { DataTypes } from 'sequelize';
import { Model, SchemaModelsBuilder, Sequelize } from '../../src';

const sequelize = new Sequelize('sqlite::memory:', {
  logging: false
});

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Message'
  }
);

const schema = new SchemaModelsBuilder();

schema.addResource(Message);

export { Message, schema, sequelize };
