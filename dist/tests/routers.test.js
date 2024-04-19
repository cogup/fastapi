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
const src_1 = require("../src");
const message_1 = require("./utils/message");
describe('MakeRouters', () => {
    it('Test OnLoad MakeRouters', async () => {
        class MessageRouters extends src_1.Builder {
            message;
            onLoad() {
                this.message = 'Hello World';
            }
            async getMessage(_request, reply) {
                reply.status(200).send({
                    message: this.message
                });
            }
        }
        __decorate([
            (0, src_1.Get)({
                path: '/messages/fake',
                summary: 'Get Message',
                description: 'Get Message',
                tags: ['Message'],
                responses: {
                    201: {
                        description: 'Get Message',
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
        ], MessageRouters.prototype, "getMessage", null);
        const fastAPI = new src_1.FastAPI({
            sequelize: message_1.sequelize,
            schema: message_1.schema,
            prefix: '/app',
            routes: [MessageRouters]
        });
        const data = await fastAPI.api.inject({
            method: 'GET',
            url: '/app/messages/fake'
        });
        expect(data.json()).toEqual({
            message: 'Hello World'
        });
        const data2 = await fastAPI.api.inject({
            method: 'GET',
            url: '/app/openapi.json'
        });
        expect(data2.statusCode).toEqual(200);
    });
});
