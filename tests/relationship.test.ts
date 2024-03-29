import { FastAPI } from '../src';
import { schema, sequelize } from './utils/message';

describe('Relationship', () => {
  it('Should create an author and associate messages', async () => {
    await sequelize.sync({ force: true });

    const fastAPI = new FastAPI({
      sequelize,
      schema
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
        authorId: createAuthor.json().id
      }
    });

    expect(createMessage.json().message).toEqual('Hello World');
  });

  it('Should retrieve messages for the first author', async () => {
    await sequelize.sync({ force: true });

    const fastAPI = new FastAPI({
      sequelize,
      schema
    });

    const createAuthor = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/authors',
      payload: {
        name: 'John Doe'
      }
    });

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        authorId: createAuthor.json().id
      }
    });

    const listMessages = await fastAPI.api.inject({
      method: 'GET',
      url: '/api/messages?include=author'
    });

    const json = listMessages.json();

    expect(json.data[0].author.id).toEqual(createAuthor.json().id);
  });

  it('Should handle message creation and retrieval for a second author', async () => {
    await sequelize.sync({ force: true });

    const fastAPI = new FastAPI({
      sequelize,
      schema
    });

    const createAuthor = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/authors',
      payload: {
        name: 'John Doe'
      }
    });

    const createAuthor2 = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/authors',
      payload: {
        name: 'Mike Doe'
      }
    });

    expect(createAuthor2.json().name).toEqual('Mike Doe');

    await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World',
        authorId: createAuthor.json().id
      }
    });

    const createMessage2 = await fastAPI.api.inject({
      method: 'POST',
      url: '/api/messages',
      payload: {
        message: 'Hello World 2',
        authorId: createAuthor2.json().id
      }
    });

    expect(createMessage2.json().message).toEqual('Hello World 2');

    const listMessages2 = await fastAPI.api.inject({
      method: 'GET',
      url: '/api/messages?include=author&search=Mike'
    });

    const json2 = listMessages2.json();

    expect(json2.data.length).toEqual(1);
    expect(json2.data[0].author.id).toEqual(createAuthor2.json().id);
  });
});
