JSON.stringify({
  openapi: '3.0.0',
  info: {
    title: 'FastAPI',
    description: 'FastAPI',
    version: '0.11.2'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server'
    }
  ],
  paths: {
    '/api/authors': {
      get: {
        summary: 'List Author',
        description: 'List and search Author',
        tags: ['Lists'],
        parameters: [
          {
            name: 'offset',
            in: 'query',
            description: 'Offset of items',
            schema: {
              type: 'integer',
              minimum: 0
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              minimum: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of items per request',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000
            }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search query string',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'orderBy',
            in: 'query',
            description: 'Order field',
            schema: {
              type: 'string',
              enum: ['id', 'name', 'createdAt', 'updatedAt']
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Order direction',
            schema: {
              type: 'string',
              enum: ['desc', 'asc']
            }
          },
          {
            name: 'include',
            in: 'query',
            description: 'Include ',
            schema: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        ],
        responses: {
          200: {
            description: 'Response for get Author',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_200'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create Author',
        description: 'Create Author',
        tags: ['Creates'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Response for get Author',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_authors_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          409: {
            description: 'Conflict',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    },
    '/api/authors/{id}': {
      get: {
        summary: 'Get Author by ID',
        description: 'Get Author by ID',
        tags: ['Reads'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Author ID',
            schema: {
              type: 'integer'
            },
            required: true
          },
          {
            name: 'include',
            in: 'query',
            description: 'Include ',
            schema: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        ],
        responses: {
          200: {
            description: 'Response for get Author',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_authors_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update Author',
        description: 'Update Author',
        tags: ['Updates'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Author ID',
            schema: {
              type: 'integer'
            },
            required: true
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Response for get Author',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_authors_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete Author',
        description: 'Delete Author',
        tags: ['Deletes'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Author ID',
            schema: {
              type: 'integer'
            },
            required: true
          }
        ],
        responses: {
          204: {
            description: 'Response for get Author',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_authors_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    },
    '/api/messages': {
      get: {
        summary: 'List Message',
        description: 'List and search Message',
        tags: ['Lists'],
        parameters: [
          {
            name: 'offset',
            in: 'query',
            description: 'Offset of items',
            schema: {
              type: 'integer',
              minimum: 0
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              minimum: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of items per request',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000
            }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search query string',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'orderBy',
            in: 'query',
            description: 'Order field',
            schema: {
              type: 'string',
              enum: ['id', 'message', 'authorId', 'createdAt', 'updatedAt']
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Order direction',
            schema: {
              type: 'string',
              enum: ['desc', 'asc']
            }
          },
          {
            name: 'include',
            in: 'query',
            description: 'Include author',
            schema: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        ],
        responses: {
          200: {
            description: 'Response for get Message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_messages_200'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create Message',
        description: 'Create Message',
        tags: ['Creates'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'text'
                  },
                  authorId: {
                    type: 'integer',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'integer'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Response for get Message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_messages_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          409: {
            description: 'Conflict',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    },
    '/api/messages/{id}': {
      get: {
        summary: 'Get Message by ID',
        description: 'Get Message by ID',
        tags: ['Reads'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Message ID',
            schema: {
              type: 'integer'
            },
            required: true
          },
          {
            name: 'include',
            in: 'query',
            description: 'Include author',
            schema: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        ],
        responses: {
          200: {
            description: 'Response for get Message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_messages_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update Message',
        description: 'Update Message',
        tags: ['Updates'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Message ID',
            schema: {
              type: 'integer'
            },
            required: true
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'text'
                  },
                  authorId: {
                    type: 'integer',
                    description: '',
                    default: undefined,
                    nullable: true,
                    'x-admin-type': 'integer'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Response for get Message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_messages_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete Message',
        description: 'Delete Message',
        tags: ['Deletes'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Message ID',
            schema: {
              type: 'integer'
            },
            required: true
          }
        ],
        responses: {
          204: {
            description: 'Response for get Message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/POST_api_messages_201'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Get health information',
        description: 'Get health information',
        responses: {
          200: {
            description: 'Response for get health',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_health_200'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    },
    '/health/all': {
      get: {
        tags: ['Health'],
        summary: 'Get all health information',
        description: 'Get all health information',
        responses: {
          200: {
            description: 'Response for get health',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_health_all_200'
                }
              }
            }
          },
          400: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          403: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          404: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          },
          500: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GET_api_authors_400'
                }
              }
            }
          }
        }
      },
      servers: [
        {
          url: 'http://localhost:3000'
        }
      ]
    }
  },
  'x-admin': {
    resources: {
      '/api/authors': {
        get: {
          types: ['list']
        },
        post: {
          types: ['create']
        }
      },
      '/api/authors/{id}': {
        get: {
          types: ['read']
        },
        put: {
          types: ['update']
        },
        delete: {
          types: ['delete']
        }
      },
      '/api/messages': {
        get: {
          types: ['list']
        },
        post: {
          types: ['create']
        }
      },
      '/api/messages/{id}': {
        get: {
          types: ['read']
        },
        put: {
          types: ['update']
        },
        delete: {
          types: ['delete']
        }
      }
    }
  },
  components: {
    schemas: {
      GET_api_authors_200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'integer'
                },
                name: {
                  type: 'string',
                  description: '',
                  default: undefined,
                  nullable: true,
                  'x-admin-type': 'string'
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'date'
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'date'
                }
              }
            }
          },
          meta: {
            type: 'object',
            properties: {
              offset: {
                type: 'integer'
              },
              page: {
                type: 'integer'
              },
              limit: {
                type: 'integer'
              },
              totalPages: {
                type: 'integer'
              },
              totalItems: {
                type: 'integer'
              }
            }
          }
        }
      },
      GET_api_authors_400: {
        type: 'object',
        properties: {
          type: {
            type: 'string'
          },
          title: {
            type: 'string'
          },
          status: {
            type: 'integer'
          },
          detail: {
            type: 'string'
          }
        }
      },
      POST_api_authors_201: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: '',
            default: undefined,
            'x-admin-type': 'integer'
          },
          name: {
            type: 'string',
            description: '',
            default: undefined,
            nullable: true,
            'x-admin-type': 'string'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '',
            default: undefined,
            'x-admin-type': 'date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '',
            default: undefined,
            'x-admin-type': 'date'
          }
        }
      },
      GET_api_messages_200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'integer'
                },
                message: {
                  type: 'string',
                  description: '',
                  default: undefined,
                  nullable: true,
                  'x-admin-type': 'text'
                },
                authorId: {
                  type: 'integer',
                  description: '',
                  default: undefined,
                  nullable: true,
                  'x-admin-type': 'integer'
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'date'
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '',
                  default: undefined,
                  'x-admin-type': 'date'
                },
                author: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    author: {
                      id: {
                        type: 'integer',
                        description: '',
                        default: undefined,
                        'x-admin-type': 'integer'
                      },
                      name: {
                        type: 'string',
                        description: '',
                        default: undefined,
                        nullable: true,
                        'x-admin-type': 'string'
                      },
                      createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: '',
                        default: undefined,
                        'x-admin-type': 'date'
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: '',
                        default: undefined,
                        'x-admin-type': 'date'
                      }
                    }
                  }
                }
              }
            }
          },
          meta: {
            type: 'object',
            properties: {
              offset: {
                type: 'integer'
              },
              page: {
                type: 'integer'
              },
              limit: {
                type: 'integer'
              },
              totalPages: {
                type: 'integer'
              },
              totalItems: {
                type: 'integer'
              }
            }
          }
        }
      },
      POST_api_messages_201: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: '',
            default: undefined,
            'x-admin-type': 'integer'
          },
          message: {
            type: 'string',
            description: '',
            default: undefined,
            nullable: true,
            'x-admin-type': 'text'
          },
          authorId: {
            type: 'integer',
            description: '',
            default: undefined,
            nullable: true,
            'x-admin-type': 'integer'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '',
            default: undefined,
            'x-admin-type': 'date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '',
            default: undefined,
            'x-admin-type': 'date'
          },
          author: {
            type: 'object',
            nullable: true,
            properties: {
              id: {
                type: 'integer',
                description: '',
                default: undefined,
                'x-admin-type': 'integer'
              },
              name: {
                type: 'string',
                description: '',
                default: undefined,
                nullable: true,
                'x-admin-type': 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: '',
                default: undefined,
                'x-admin-type': 'date'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: '',
                default: undefined,
                'x-admin-type': 'date'
              }
            }
          }
        }
      },
      GET_health_200: {
        type: 'object',
        properties: {
          status: {
            type: 'string'
          }
        }
      },
      GET_health_all_200: {
        type: 'object',
        properties: {
          server: {
            type: 'object',
            properties: {
              platform: {
                type: 'string'
              },
              release: {
                type: 'string'
              },
              arch: {
                type: 'string'
              },
              uptime: {
                type: 'number'
              },
              cpus: {
                type: 'number'
              }
            }
          },
          memory: {
            type: 'object',
            properties: {
              total: {
                type: 'number'
              },
              free: {
                type: 'number'
              },
              used: {
                type: 'number'
              },
              active: {
                type: 'number'
              },
              available: {
                type: 'number'
              }
            }
          },
          process: {
            type: 'object',
            properties: {
              pid: {
                type: 'number'
              },
              uptime: {
                type: 'number'
              },
              versions: {
                type: 'object'
              },
              memoryUsage: {
                type: 'object'
              }
            }
          },
          os: {
            type: 'object',
            properties: {
              hostname: {
                type: 'string'
              },
              type: {
                type: 'string'
              },
              platform: {
                type: 'string'
              },
              release: {
                type: 'string'
              },
              arch: {
                type: 'string'
              },
              uptime: {
                type: 'number'
              },
              cpus: {
                type: 'number'
              }
            }
          },
          container: {
            type: 'object',
            properties: {
              image: {
                type: 'string'
              },
              version: {
                type: 'string'
              },
              containerId: {
                type: 'string'
              }
            }
          },
          database: {
            type: 'object',
            properties: {
              dialect: {
                type: 'string'
              },
              host: {
                type: 'string'
              },
              port: {
                type: 'number'
              },
              database: {
                type: 'string'
              },
              username: {
                type: 'string'
              }
            }
          },
          status: {
            type: 'string'
          }
        }
      }
    }
  }
});
