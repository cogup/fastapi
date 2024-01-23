import { DataTypes } from 'sequelize';
import { Model, SchemaModelsBuilder, Sequelize } from '../../src';

const sequelize = new Sequelize('sqlite::memory:', {
  logging: false
});

class Author extends Model {}

Author.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Author'
  }
);

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
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Author,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'Message'
  }
);

Author.hasMany(Message, {
  foreignKey: 'authorId',
  as: 'messages'
});

Message.belongsTo(Author, {
  foreignKey: 'authorId',
  as: 'author'
});

const schema = new SchemaModelsBuilder();

schema.addResource(Author);

schema.addResource(Message, {
  authorId: {
    include: Author
  }
});

export { Message, Author, schema, sequelize };
