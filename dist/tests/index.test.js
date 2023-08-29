"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../src/resources/sequelize");
const src_1 = require("../src");
const portsUsed = [];
function getRandomPort() {
    let port = 0;
    do {
        port = Math.floor(Math.random() * 65535) + 1;
    } while (portsUsed.includes(port));
    return port;
}
describe('FastAPI', () => {
    describe('Lib and Loaders', () => {
        it('should initialize FastAPI with default values if no parameters are passed', () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            expect(fastAPI).toBeInstanceOf(index_1.FastAPI);
        });
        it('should initialize FastAPI with the passed parameters', () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            fastAPI.setDatabase({
                database: 'testDB',
                username: 'testUser',
                password: 'testPassword'
            });
            expect(fastAPI.database.database).toEqual('testDB');
            expect(fastAPI.database.username).toEqual('testUser');
            expect(fastAPI.database.password).toEqual('testPassword');
        });
        it('should add a schema for hello', async () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            const schema = new index_1.SchemaBuilder();
            const helloSchema = schema
                .table('hello')
                .column({
                name: 'id',
                type: sequelize_2.ColumnType.INT,
                primaryKey: true,
                autoIncrement: true
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.STRING,
                allowNull: false
            })
                .column({
                name: 'createdAt',
                type: sequelize_2.ColumnType.DATE
            })
                .column({
                name: 'updatedAt',
                type: sequelize_2.ColumnType.DATE
            })
                .build()
                .schema.build();
            const mockHello = {
                message: 'Hello, world!'
            };
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.loadSchema(helloSchema);
            const { Hello } = fastAPI.models;
            await Hello.sync({ force: true });
            await Hello.create(mockHello);
            const result = await Hello.findOne({
                where: { message: mockHello.message }
            });
            expect(result).toBeTruthy();
            expect(result?.dataValues.message).toBe(mockHello.message);
        });
        it('should add a route for /hello', async () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            fastAPI.get('/', {
                responses: (0, index_1.makeResponses)('init', 222, {
                    message: {
                        type: sequelize_2.ColumnType.STRING
                    }
                }),
                handler: (_request, reply) => {
                    reply.status(222).send({
                        message: 'Hello, world!'
                    });
                }
            });
            fastAPI.loadRoutes();
            const response = await fastAPI.api.inject({
                method: 'GET',
                url: '/'
            });
            expect(response.statusCode).toBe(222);
            expect(response.json()).toEqual({ message: 'Hello, world!' });
        });
        it('should add a route for /hello 2', async () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            const routes = new index_1.RoutesBuilder();
            const builded = routes
                .path('/')
                .get({
                responses: (0, index_1.makeResponses)('init', 222, {
                    message: {
                        type: sequelize_2.ColumnType.STRING
                    }
                }),
                handler: (_request, reply) => {
                    reply.status(222).send({
                        message: 'Hello, world!'
                    });
                }
            })
                .build();
            fastAPI.addRoutes(builded);
            fastAPI.loadRoutes();
            const response = await fastAPI.api.inject({
                method: 'GET',
                url: '/'
            });
            expect(response.statusCode).toBe(222);
            expect(response.json()).toEqual({ message: 'Hello, world!' });
            await fastAPI.api.close();
        });
    });
    describe('Schema and Server', () => {
        const fastAPI = new index_1.FastAPI({
            listen: {
                port: 30000
            }
        });
        beforeAll(async () => {
            const schema = new index_1.SchemaBuilder({
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            });
            const messageTable = new index_1.TableBuilder({
                name: 'messages',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.CODE,
                allowNull: false
            })
                .column({
                name: 'privateData',
                type: sequelize_2.ColumnType.STRING,
                defaultValue: 'privateDefault',
                private: true
            })
                .column({
                name: 'protectedData',
                type: sequelize_2.ColumnType.STRING,
                protected: true
            })
                .build();
            new index_1.TableBuilder({
                name: 'chats',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            })
                .column({
                name: 'messageId',
                type: sequelize_2.ColumnType.INT,
                allowNull: false,
                reference: messageTable
            })
                .build();
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setSchema(schema.build());
            fastAPI.setDatabaseInstance(sequelize);
        });
        afterAll(async () => {
            await fastAPI.api.close();
        });
        it('should start the server', async () => {
            await fastAPI.start();
        });
        it('should post', async () => {
            const responsePost = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/messages',
                payload: {
                    message: 'Hello, world!',
                    protectedData: 'protected'
                }
            });
            const responsePost2 = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/messages',
                payload: {
                    message: 'Hello, world 2!',
                    protectedData: 'protected'
                }
            });
            expect(responsePost.statusCode).toBe(201);
            const data1 = responsePost.json();
            delete data1.createdAt;
            delete data1.updatedAt;
            expect(data1).toEqual({
                id: 1,
                message: 'Hello, world!'
            });
            expect(responsePost2.statusCode).toBe(201);
            const data2 = responsePost2.json();
            delete data2.createdAt;
            delete data2.updatedAt;
            expect(data2).toEqual({
                id: 2,
                message: 'Hello, world 2!'
            });
        });
        it('should get', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/messages'
            });
            expect(responseGet.statusCode).toBe(200);
            const { data, meta } = responseGet.json();
            const dataClean = data.map((item) => {
                delete item.createdAt;
                delete item.updatedAt;
                return item;
            });
            expect({ data: dataClean, meta }).toEqual({
                data: [
                    {
                        id: 2,
                        message: 'Hello, world 2!'
                    },
                    {
                        id: 1,
                        message: 'Hello, world!'
                    }
                ],
                meta: { offset: 0, limit: 10, totalPages: 1, totalItems: 2 }
            });
        });
        it('should pagination', async () => {
            const responsePost = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/messages',
                payload: {
                    message: 'Hello, world 3!',
                    protectedData: 'protected'
                }
            });
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/messages?limit=2&offset=2'
            });
            expect(responseGet.statusCode).toBe(200);
            const { data, meta } = responseGet.json();
            const dataClean = data.map((item) => {
                delete item.createdAt;
                delete item.updatedAt;
                return item;
            });
            expect({ data: dataClean, meta }).toEqual({
                data: [
                    {
                        id: 1,
                        message: 'Hello, world!'
                    }
                ],
                meta: { offset: 2, limit: 2, totalPages: 2, totalItems: 3 }
            });
            expect(dataClean.length).toBe(1);
        });
        it('should get by id', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/messages/1'
            });
            expect(responseGet.statusCode).toBe(200);
            const data = responseGet.json();
            delete data.createdAt;
            delete data.updatedAt;
            expect(data).toEqual({
                id: 1,
                message: 'Hello, world!'
            });
        });
        it('should put', async () => {
            const responsePut = await fastAPI.api.inject({
                method: 'PUT',
                url: '/api/messages/1',
                payload: {
                    message: 'Hello, world 3!',
                    protectedData: 'protected 2'
                }
            });
            expect(responsePut.statusCode).toBe(200);
            const data = responsePut.json();
            delete data.createdAt;
            delete data.updatedAt;
            expect(data).toEqual({
                id: 1,
                message: 'Hello, world 3!'
            });
        });
        it('should delete', async () => {
            const responseDelete = await fastAPI.api.inject({
                method: 'DELETE',
                url: '/api/messages/1'
            });
            expect(responseDelete.statusCode).toBe(204);
        });
        it('should get by id not found', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/messages/1'
            });
            expect(responseGet.statusCode).toBe(404);
        });
        it('should get health', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/health'
            });
            expect(responseGet.statusCode).toBe(200);
            expect(responseGet.json()).toEqual({
                status: 'UP'
            });
        });
        it('should get all info health', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/health/all'
            });
            expect(responseGet.statusCode).toBe(200);
        });
        it('should get openapi especification', async () => {
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/openapi.json'
            });
            expect(responseGet.statusCode).toBe(200);
        });
        it('should relationship', async () => {
            const data = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/chats',
                payload: {
                    messageId: 1,
                    protectedData: 'protected'
                }
            });
            expect(data.statusCode).toBe(201);
            const responseGet = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/chats/1'
            });
            expect(responseGet.statusCode).toBe(200);
        });
    });
    describe('Test api', () => {
        it('Teste Lib Api', async () => {
            const fastAPI = new index_1.FastAPI({
                listen: {
                    port: getRandomPort()
                }
            });
            const schema = new index_1.SchemaBuilder({
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            });
            const messageTable = new index_1.TableBuilder({
                name: 'messages',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'name',
                type: sequelize_2.ColumnType.STRING,
                allowNull: false
            })
                .build();
            new index_1.TableBuilder({
                name: 'chats',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'messageId',
                type: sequelize_2.ColumnType.INT,
                allowNull: false,
                reference: messageTable
            })
                .build();
            new index_1.TableBuilder({
                name: 'settings',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            })
                .column({
                name: 'name',
                type: sequelize_2.ColumnType.STRING
            })
                .build();
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setSchema(schema.build());
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.loadResources();
        });
    });
    describe('Test Decorations', () => {
        it('Test Handlers', async () => {
            const fastAPI = new index_1.FastAPI({
                listen: {
                    port: getRandomPort()
                }
            });
            const schema = new index_1.SchemaBuilder({
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            });
            const messages = new index_1.TableBuilder({
                name: 'messages',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.STRING
            })
                .build();
            const chats = new index_1.TableBuilder({
                name: 'chats',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.STRING
            })
                .build();
            const { Create } = src_1.Decorators;
            class MyHandler extends src_1.Decorators.MakeHandlers {
                messagesCreate(_request, reply) {
                    reply.status(201).send({
                        message: 'Hello, Message!'
                    });
                }
                chatCreate(_request, reply) {
                    reply.status(201).send({
                        message: 'Hello, Chat!'
                    });
                }
            }
            __decorate([
                Create(messages),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyHandler.prototype, "messagesCreate", null);
            __decorate([
                Create(chats),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyHandler.prototype, "chatCreate", null);
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setSchema(schema.build());
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.addHandlers(MyHandler);
            fastAPI.loadResources();
            const data = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/messages',
                payload: {
                    messageId: 1,
                    protectedData: 'protected'
                }
            });
            expect(data.json()).toEqual({
                message: 'Hello, Message!'
            });
            const data2 = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/chats',
                payload: {
                    messageId: 1,
                    protectedData: 'protected'
                }
            });
            expect(data2.json()).toEqual({
                message: 'Hello, Chat!'
            });
        });
        it('Test Handlers Instancied', async () => {
            const fastAPI = new index_1.FastAPI({
                listen: {
                    port: getRandomPort()
                }
            });
            const schema = new index_1.SchemaBuilder({
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT]
            });
            const messages = new index_1.TableBuilder({
                name: 'messages',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.STRING
            })
                .build();
            const chats = new index_1.TableBuilder({
                name: 'chats',
                schema: schema,
                auto: [index_1.AutoColumn.ID, index_1.AutoColumn.CREATED_AT, index_1.AutoColumn.UPDATED_AT],
                group: 'msg'
            })
                .column({
                name: 'message',
                type: sequelize_2.ColumnType.STRING
            })
                .build();
            const { Create } = src_1.Decorators;
            class MyHandler extends src_1.Decorators.MakeHandlers {
                messagesCreate(_request, reply) {
                    reply.status(201).send({
                        message: 'Hello, Message!'
                    });
                }
                chatCreate(_request, reply) {
                    reply.status(201).send({
                        message: 'Hello, Chat!'
                    });
                }
            }
            __decorate([
                Create(messages),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyHandler.prototype, "messagesCreate", null);
            __decorate([
                Create(chats),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyHandler.prototype, "chatCreate", null);
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setSchema(schema.build());
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.addHandlers(new MyHandler());
            fastAPI.loadResources();
            const data = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/messages',
                payload: {
                    messageId: 1,
                    protectedData: 'protected'
                }
            });
            expect(data.json()).toEqual({
                message: 'Hello, Message!'
            });
            const data2 = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/chats',
                payload: {
                    messageId: 1,
                    protectedData: 'protected'
                }
            });
            expect(data2.json()).toEqual({
                message: 'Hello, Chat!'
            });
        });
        it('Test Routes', async () => {
            const fastAPI = new index_1.FastAPI({
                listen: {
                    port: getRandomPort()
                }
            });
            const { Get, Post } = src_1.Decorators;
            class MyRoutes extends src_1.Decorators.MakeRouters {
                port = 0;
                onLoad(fastapi) {
                    this.port = fastapi.listenConfig.port ?? 0;
                }
                test1(_request, reply) {
                    reply.status(200).send({
                        message: `Test get in port ${this.port}`
                    });
                }
                test2(request, reply) {
                    const { message } = request.body;
                    reply.status(201).send({
                        message: `Test post ${message}`
                    });
                }
            }
            __decorate([
                Get('/test'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyRoutes.prototype, "test1", null);
            __decorate([
                Post({
                    path: '/test',
                    responses: (0, index_1.makeResponses)('init', 201, {
                        message: {
                            type: sequelize_2.ColumnType.STRING
                        }
                    }),
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyRoutes.prototype, "test2", null);
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.addRoutes(MyRoutes);
            fastAPI.loadRoutes();
            fastAPI.afterLoadExecute();
            const data = await fastAPI.api.inject({
                method: 'GET',
                url: '/test'
            });
            expect(data.json()).toEqual({
                message: `Test get in port ${fastAPI.listenConfig.port}`
            });
            const data2 = await fastAPI.api.inject({
                method: 'POST',
                url: '/test'
            });
            expect(data2.statusCode).toBe(400);
            const data3 = await fastAPI.api.inject({
                method: 'POST',
                url: '/test',
                payload: {
                    message: 'Uhuu'
                }
            });
            expect(data3.json()).toEqual({
                message: 'Test post Uhuu'
            });
        });
        it('Test Routes Instancied', async () => {
            const fastAPI = new index_1.FastAPI({
                listen: {
                    port: getRandomPort()
                }
            });
            const { Get, Post } = src_1.Decorators;
            class MyRoutes extends src_1.Decorators.MakeRouters {
                port = 0;
                constructor(port) {
                    super();
                    this.port = port;
                }
                test1(_request, reply) {
                    reply.status(200).send({
                        message: `Test get in port ${this.port}`
                    });
                }
                test2(request, reply) {
                    const { message } = request.body;
                    reply.status(201).send({
                        message: `Test post ${message}`
                    });
                }
            }
            __decorate([
                Get('/test'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyRoutes.prototype, "test1", null);
            __decorate([
                Post({
                    path: '/test',
                    responses: (0, index_1.makeResponses)('init', 201, {
                        message: {
                            type: sequelize_2.ColumnType.STRING
                        }
                    }),
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], MyRoutes.prototype, "test2", null);
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            fastAPI.setDatabaseInstance(sequelize);
            fastAPI.addRoutes(new MyRoutes(fastAPI.listenConfig.port));
            fastAPI.loadRoutes();
            fastAPI.afterLoadExecute();
            const data = await fastAPI.api.inject({
                method: 'GET',
                url: '/test'
            });
            expect(data.json()).toEqual({
                message: `Test get in port ${fastAPI.listenConfig.port}`
            });
            const data2 = await fastAPI.api.inject({
                method: 'POST',
                url: '/test'
            });
            expect(data2.statusCode).toBe(400);
            const data3 = await fastAPI.api.inject({
                method: 'POST',
                url: '/test',
                payload: {
                    message: 'Uhuu'
                }
            });
            expect(data3.json()).toEqual({
                message: 'Test post Uhuu'
            });
        });
    });
});
