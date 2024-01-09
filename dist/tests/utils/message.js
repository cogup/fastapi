"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.schema = exports.Message = void 0;
const sequelize_1 = require("sequelize");
const src_1 = require("../../src");
const sequelize = new src_1.Sequelize('sqlite::memory:', {
    logging: false
});
exports.sequelize = sequelize;
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
    }
}, {
    sequelize,
    modelName: 'Message'
});
const schema = new src_1.SchemaModelsBuilder();
exports.schema = schema;
schema.addResource(Message);
