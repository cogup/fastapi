"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const sequelize_1 = require("sequelize");
describe('Events', () => {
    it('Test events by Model', async () => {
        const sequelize = new index_1.Sequelize('sqlite::memory:', {
            logging: false
        });
        class User extends index_1.Model {
        }
        User.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: sequelize_1.DataTypes.STRING
            },
            email: {
                type: sequelize_1.DataTypes.STRING
            }
        }, {
            sequelize,
            modelName: 'User',
            createdAt: false,
            updatedAt: false
        });
        const schema = new index_1.SchemaModelsBuilder();
        schema.addResource(User);
        const fastAPI = new index_1.FastAPI({
            schema,
            sequelize
        });
        fastAPI.on(User, index_1.HandlerType.CREATE, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        await fastAPI.api.inject({
            method: 'POST',
            url: '/api/users',
            payload: {
                name: 'User 1',
                email: 'test@test.test'
            }
        });
    });
    it('Test events custom model', async () => {
        const sequelize = new index_1.Sequelize('sqlite::memory:', {
            logging: false
        });
        class User extends index_1.Model {
        }
        User.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: sequelize_1.DataTypes.STRING
            },
            email: {
                type: sequelize_1.DataTypes.STRING
            }
        }, {
            sequelize,
            modelName: 'User',
            createdAt: false,
            updatedAt: false
        });
        const schema = new index_1.SchemaModelsBuilder();
        schema.addResource(User);
        const fastAPI = new index_1.FastAPI({
            schema,
            sequelize
        });
        let CustomEvent;
        (function (CustomEvent) {
            CustomEvent["TEST"] = "TEST";
        })(CustomEvent || (CustomEvent = {}));
        fastAPI.on(User, CustomEvent.TEST, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        fastAPI.emit(User, CustomEvent.TEST, null, { test: true });
    });
    it('Test events string', async () => {
        const fastAPI = new index_1.FastAPI();
        let CustomEvent;
        (function (CustomEvent) {
            CustomEvent["TEST"] = "TEST";
        })(CustomEvent || (CustomEvent = {}));
        fastAPI.on('test', CustomEvent.TEST, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        fastAPI.emit('test', CustomEvent.TEST, null, { test: true });
    });
    it('Test events string and action number', async () => {
        const fastAPI = new index_1.FastAPI();
        fastAPI.on('test', 1, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        fastAPI.on('test', 2, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        fastAPI.emit('test', 2, null, { test: true });
    });
    it('Test events by Model', async () => {
        const sequelize = new index_1.Sequelize('sqlite::memory:', {
            logging: false
        });
        class User extends index_1.Model {
        }
        User.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: sequelize_1.DataTypes.STRING
            },
            email: {
                type: sequelize_1.DataTypes.STRING
            }
        }, {
            sequelize,
            modelName: 'User',
            createdAt: false,
            updatedAt: false
        });
        const schema = new index_1.SchemaModelsBuilder();
        schema.addResource(User);
        const fastAPI = new index_1.FastAPI({
            schema,
            sequelize
        });
        fastAPI.on(User, index_1.HandlerType.CREATE, (err, data) => {
            expect(err).toBeFalsy();
            expect(data).toBeTruthy();
        });
        await fastAPI.api.inject({
            method: 'POST',
            url: '/api/users',
            payload: {
                name: 'User 1',
                email: 'test@test.test'
            }
        });
    });
});
