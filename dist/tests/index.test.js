"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const sequelize_1 = require("../src/resources/sequelize");
const sequelize_2 = require("sequelize");
describe('FastAPI', () => {
    describe('Lib and Loaders', () => {
        it('should initialize FastAPI with default values if no parameters are passed', () => {
            const fastAPI = new index_1.FastAPI();
            fastAPI.api.log.level = 'silent';
            expect(fastAPI).toBeInstanceOf(index_1.FastAPI);
        });
        it('should add a schema for hello', async () => {
            const sequelize = new index_1.Sequelize('sqlite::memory:', {
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
                type: sequelize_1.ResourceType.INT,
                primaryKey: true,
                autoIncrement: true
            })
                .column({
                name: 'message',
                type: sequelize_1.ResourceType.STRING,
                allowNull: false
            })
                .column({
                name: 'createdAt',
                type: sequelize_1.ResourceType.DATE
            })
                .column({
                name: 'updatedAt',
                type: sequelize_1.ResourceType.DATE
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
        });
        it('should add a route for /hello', async () => {
            const fastAPI = new index_1.FastAPI({
                autoLoadRoutes: false
            });
            fastAPI.api.log.level = 'silent';
            fastAPI.get('/', {
                responses: (0, index_1.makeResponses)('init', 222, {
                    message: {
                        type: sequelize_1.ResourceType.STRING
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
            const fastAPI = new index_1.FastAPI({
                autoLoadRoutes: false
            });
            fastAPI.api.log.level = 'silent';
            const routes = new index_1.RoutesBuilder();
            const builded = routes
                .path('/')
                .get({
                responses: (0, index_1.makeResponses)('init', 222, {
                    message: {
                        type: sequelize_1.ResourceType.STRING
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
    describe('Events', () => {
        it('Test events by Model', async () => {
            const sequelize = new index_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            class User extends index_1.Model {
            }
            User.init({
                id: {
                    type: sequelize_2.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: sequelize_2.DataTypes.STRING
                },
                email: {
                    type: sequelize_2.DataTypes.STRING
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
                    type: sequelize_2.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: sequelize_2.DataTypes.STRING
                },
                email: {
                    type: sequelize_2.DataTypes.STRING
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
                    type: sequelize_2.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: sequelize_2.DataTypes.STRING
                },
                email: {
                    type: sequelize_2.DataTypes.STRING
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
    describe('Features', () => {
        it('Test sequelize Model', async () => {
            const sequelize = new index_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            class User extends index_1.Model {
            }
            let UserStatus;
            (function (UserStatus) {
                UserStatus["ACTIVE"] = "ACTIVE";
                UserStatus["INACTIVE"] = "INACTIVE";
            })(UserStatus || (UserStatus = {}));
            User.init({
                id: {
                    type: sequelize_2.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: sequelize_2.DataTypes.STRING
                },
                email: {
                    type: sequelize_2.DataTypes.STRING
                },
                status: {
                    type: sequelize_2.DataTypes.ENUM(UserStatus.ACTIVE, UserStatus.INACTIVE),
                    defaultValue: UserStatus.ACTIVE
                }
            }, {
                sequelize,
                modelName: 'User',
                createdAt: false,
                updatedAt: false
            });
            class Post extends index_1.Model {
            }
            Post.init({
                id: {
                    type: sequelize_2.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                title: {
                    type: sequelize_2.DataTypes.STRING,
                    allowNull: false
                },
                content: {
                    type: sequelize_2.DataTypes.TEXT,
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
                    type: sequelize_1.ResourceType.CODE
                }
            });
            const fastAPI = new index_1.FastAPI({
                schema,
                sequelize
            });
            await sequelize.sync({ force: true });
            const data = await fastAPI.api.inject({
                method: 'POST',
                url: '/api/users',
                payload: {
                    name: 'User 1',
                    email: 'example@mail.com'
                }
            });
            expect(data.json()).toEqual({
                id: 1,
                name: 'User 1',
                email: 'example@mail.com',
                status: 'ACTIVE'
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
                id: 1,
                title: 'Post 1',
                content: 'Content 1'
            });
        });
        it('Search in column', async () => {
            const sequelize = new index_1.Sequelize('sqlite::memory:', {
                logging: false
            });
            class Posts extends index_1.Model {
            }
            Posts.init({
                title: {
                    type: sequelize_2.DataTypes.STRING,
                    allowNull: false
                },
                content: {
                    type: sequelize_2.DataTypes.TEXT,
                    allowNull: false
                }
            }, {
                sequelize,
                modelName: 'Posts',
                createdAt: true,
                updatedAt: true
            });
            const schema = new index_1.SchemaModelsBuilder();
            schema.addResource(Posts, {
                title: {
                    search: true
                },
                content: {
                    search: true
                }
            });
            const fastAPI = new index_1.FastAPI({
                schema,
                sequelize
            });
            await sequelize.sync({ force: true });
            await fastAPI.api.inject({
                method: 'POST',
                url: '/api/posts',
                payload: {
                    title: 'Why make this?',
                    content: 'You can make this with FastAPI'
                }
            });
            await fastAPI.api.inject({
                method: 'POST',
                url: '/api/posts',
                payload: {
                    title: 'What is FastAPI?',
                    content: 'You have to know FastAPI'
                }
            });
            await fastAPI.api.inject({
                method: 'POST',
                url: '/api/posts',
                payload: {
                    title: 'Where is FastAPI?',
                    content: 'No one knows'
                }
            });
            const data = await fastAPI.api.inject({
                method: 'GET',
                url: '/api/posts?search=Where'
            });
            const item = data.json();
            const result = item.data[0];
            expect(result).toEqual({
                id: 3,
                title: 'Where is FastAPI?',
                content: 'No one knows',
                createdAt: result.createdAt,
                updatedAt: result.updatedAt
            });
        });
    });
});
