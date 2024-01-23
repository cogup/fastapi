"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const message_1 = require("./utils/message");
describe('Relationship', () => {
    it('Test Relationship', async () => {
        await message_1.sequelize.sync({ force: true });
        const fastAPI = new src_1.FastAPI({
            sequelize: message_1.sequelize,
            schema: message_1.schema
        });
        const createAuthor = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/authors',
            payload: {
                name: 'John Doe'
            }
        });
        expect(createAuthor.json().name).toEqual('John Doe');
        const createMessage = await fastAPI.api.inject({
            method: 'POST',
            url: '/api/messages',
            payload: {
                message: 'Hello World',
                authorId: 1
            }
        });
        expect(createMessage.json().message).toEqual('Hello World');
        const listMessages = await fastAPI.api.inject({
            method: 'GET',
            url: '/api/messages'
        });
        expect(listMessages.json().data[0].author.id).toEqual(1);
    });
});
