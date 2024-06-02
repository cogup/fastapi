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
const events_1 = require("../src/resources/events");
const src_1 = require("../src");
const message_1 = require("./utils/message");
describe('Decorators', () => {
    it('Test OnLoad', async () => {
        let result = null;
        let onLoaded = false;
        let done = false;
        let MessageTest = 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class MessageTest extends src_1.Builder {
            message;
            onLoad() {
                onLoaded = true;
                this.message = 'Hello World';
            }
            async eventCreateMessage(err, data) {
                if (err) {
                    throw err;
                }
                result = data;
            }
            async done(_err, data) {
                done = data;
            }
            async getMessage(_request, reply) {
                reply.status(201).send({
                    message: this.message
                });
                (0, events_1.emit)('done', null, true);
            }
            async test(_request, reply) {
                reply.status(201).send({
                    message: this.message
                });
            }
        };
        __decorate([
            (0, src_1.OnCreate)(message_1.Message),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object]),
            __metadata("design:returntype", Promise)
        ], MessageTest.prototype, "eventCreateMessage", null);
        __decorate([
            (0, src_1.OnEvent)('done'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Boolean]),
            __metadata("design:returntype", Promise)
        ], MessageTest.prototype, "done", null);
        __decorate([
            (0, src_1.Update)(message_1.Message),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Request, Object]),
            __metadata("design:returntype", Promise)
        ], MessageTest.prototype, "getMessage", null);
        __decorate([
            (0, src_1.Get)({
                path: '/test',
                prefix: '',
                summary: 'Test',
                description: 'Test',
                tags: ['test'],
                responses: {
                    200: {
                        description: 'Test',
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
                }
            }),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Request, Object]),
            __metadata("design:returntype", Promise)
        ], MessageTest.prototype, "test", null);
        MessageTest = __decorate([
            src_1.inject
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ], MessageTest);
        const fastAPI = new src_1.FastAPI({
            sequelize: message_1.sequelize,
            schema: message_1.schema
        });
        await fastAPI.sequelize?.sync();
        const eventsStorage = (0, events_1.getEventsStorage)();
        expect(Object.keys(eventsStorage).length).toBe(2);
        const dataCreate = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/messages',
            payload: {
                message: 'Hello World',
                userId: 1
            }
        });
        await fastAPI.api.inject({
            method: 'PUT',
            url: '/api/messages/{1}',
            payload: {
                message: 'Changed!'
            }
        });
        const dataRoute = await fastAPI.api.inject({
            method: 'GET',
            url: '/test'
        });
        expect(onLoaded).toBe(true);
        expect(done).toBe(true);
        expect(result.data.dataValues.id).toEqual(1);
        expect(dataCreate.json().message).toEqual('Hello World');
        expect(dataRoute.json().message).toEqual('Hello World');
    });
});
