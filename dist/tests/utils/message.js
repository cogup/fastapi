"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.schema = exports.Author = exports.Message = void 0;
const sequelize_1 = require("sequelize");
const src_1 = require("../../src");
const sequelize = new src_1.Sequelize('sqlite::memory:', {
    logging: false
});
exports.sequelize = sequelize;
class Author extends src_1.Model {
}
exports.Author = Author;
Author.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Author'
});
class Message extends src_1.Model {
}
exports.Message = Message;
Message.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    authorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Author,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Message'
});
Author.hasMany(Message, {
    foreignKey: 'authorId',
    as: 'messages'
});
Message.belongsTo(Author, {
    foreignKey: 'authorId',
    as: 'author'
});
const schema = new src_1.SchemaModelsBuilder();
exports.schema = schema;
schema.addResource(Author);
schema.addResource(Message, {
    authorId: {
        include: Author
    }
});
