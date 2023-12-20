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
describe('MakeEvents', () => {
    it('Test OnLoad MakeEvents', async () => {
        let result = null;
        let onLoaded = false;
        let done = false;
        class MessageEvents extends src_1.MakeEvents {
            onLoad() {
                onLoaded = true;
            }
            async getMessage(err, data) {
                if (err) {
                    throw err;
                }
                result = data;
                (0, events_1.emitAction)(message_1.Message, 'done', null, true);
            }
            async done(_err, data) {
                done = data;
            }
        }
        __decorate([
            (0, src_1.OnCreate)(message_1.Message),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object]),
            __metadata("design:returntype", Promise)
        ], MessageEvents.prototype, "getMessage", null);
        __decorate([
            (0, src_1.OnEvent)(message_1.Message, 'done'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Boolean]),
            __metadata("design:returntype", Promise)
        ], MessageEvents.prototype, "done", null);
        const fastAPI = new src_1.FastAPI({
            sequelize: message_1.sequelize,
            schema: message_1.schema,
            events: [MessageEvents]
        });
        await fastAPI.sequelize?.sync();
        const eventsStorage = (0, events_1.getEventsStorage)();
        expect(Object.keys(eventsStorage).length).toBe(2);
        const data = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/messages',
            payload: {
                message: 'Hello World',
                userId: 1
            }
        });
        expect(onLoaded).toBe(true);
        expect(done).toBe(true);
        expect(result.dataValues.id).toEqual(data.json().id);
    });
});
