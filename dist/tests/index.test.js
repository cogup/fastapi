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
const sequelize_3 = require("sequelize");
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
        it('should add a schema for hello', async () => {
            const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            const fastAPI = new index_1.FastAPI({
                sequelize
            });
            fastAPI.api.log.level = 'silent';
            const schema = new index_1.SchemaBuilder();
            const helloSchema = schema
                .table('hello')
                .column({
                name: 'id',
                type: sequelize_2.ResourceType.INT,
                primaryKey: true,
                autoIncrement: true
            })
                .column({
                name: 'message',
                type: sequelize_2.ResourceType.STRING,
                allowNull: false
            })
                .column({
                name: 'createdAt',
                type: sequelize_2.ResourceType.DATE
            })
                .column({
                name: 'updatedAt',
                type: sequelize_2.ResourceType.DATE
            })
                .build()
                .schema.build();
            await sequelize.sync({ force: true });
            const mockHello = {
                message: 'Hello, world!'
            };
            fastAPI.loadSchema(helloSchema);
            const { Hello } = fastAPI.models;
            await Hello.sync({ force: true });
            await Hello.create(mockHello);
            const result = await Hello.findOne({
                where: { message: mockHello.message }
            });
            expect(result).toBeTruthy();
            expect(result?.dataValues.message).toBe(mockHello.message);
            await sequelize.close();
            await fastAPI.api.close();
        });
        it('should add a route for /hello', async () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            fastAPI.get('/', {
                responses: (0, index_1.makeResponses)('init', 222, {
                    message: {
                        type: sequelize_2.ResourceType.STRING
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
                        type: sequelize_2.ResourceType.STRING
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
                type: sequelize_2.ResourceType.STRING
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
                type: sequelize_2.ResourceType.STRING
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
            await sequelize.sync({ force: true });
            fastAPI.setSchema(schema.build());
            fastAPI.setSequelize(sequelize);
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
            await sequelize.close();
            await fastAPI.api.close();
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
                type: sequelize_2.ResourceType.STRING
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
                type: sequelize_2.ResourceType.STRING
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
            await sequelize.sync({ force: true });
            fastAPI.setSchema(schema.build());
            fastAPI.setSequelize(sequelize);
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
            await sequelize.close();
            await fastAPI.api.close();
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
                            type: sequelize_2.ResourceType.STRING
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
            await sequelize.sync({ force: true });
            fastAPI.setSequelize(sequelize);
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
            await sequelize.close();
            await fastAPI.api.close();
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
                            type: sequelize_2.ResourceType.STRING
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
            await sequelize.sync({ force: true });
            fastAPI.setSequelize(sequelize);
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
            await sequelize.close();
            await fastAPI.api.close();
        });
    });
    it('Test sequelize Model', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
            logging: false
        });
        class User extends sequelize_3.Model {
            id;
            name;
            email;
        }
        User.init({
            id: {
                type: sequelize_3.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: sequelize_3.DataTypes.STRING
            },
            email: {
                type: sequelize_3.DataTypes.STRING
            }
        }, {
            sequelize,
            modelName: 'User',
            createdAt: false,
            updatedAt: false
        });
        class Post extends sequelize_3.Model {
            id;
            title;
            content;
        }
        Post.init({
            id: {
                type: sequelize_3.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            title: {
                type: sequelize_3.DataTypes.STRING,
                allowNull: false
            },
            content: {
                type: sequelize_3.DataTypes.TEXT,
                allowNull: false
            }
        }, {
            sequelize,
            modelName: 'Post',
            createdAt: false,
            updatedAt: false
        });
        const schema = new index_1.SchemaModelsBuilder();
        schema.addResource(User);
        schema.addResource(Post, {
            content: {
                type: sequelize_2.ResourceType.CODE
            }
        });
        const fastAPI = new index_1.FastAPI({
            listen: {
                port: getRandomPort()
            },
            schema,
            sequelize
        });
        await sequelize.sync({ force: true });
        await fastAPI.start();
        const data = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/users',
            payload: {
                name: 'User 1',
                email: 'example@mail.com'
            }
        });
        expect(data.json()).toEqual({
            id: 0,
            name: 'User 1',
            email: 'example@mail.com'
        });
        const data2 = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/posts',
            payload: {
                title: 'Post 1',
                content: 'Content 1'
            }
        });
        expect(data2.json()).toEqual({
            id: 0,
            title: 'Post 1',
            content: 'Content 1'
        });
        await sequelize.close();
        await fastAPI.api.close();
    });
});
