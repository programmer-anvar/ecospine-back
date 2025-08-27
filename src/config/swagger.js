const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'EcoSpine Backend API',
        version: '1.0.0',
        description: 'Professional backend API for EcoSpine application with posts and file upload functionality',
        contact: {
            name: 'EcoSpine Development Team',
            email: 'dev@ecospine.com'
        },
        license: {
            name: 'ISC',
            url: 'https://opensource.org/licenses/ISC'
        }
    },
    servers: [
        {
            url: 'http://localhost:8080/api/v1',
            description: 'Development server'
        },
        {
            url: 'https://api.ecospine.com/api/v1',
            description: 'Production server'
        }
    ],
    components: {
        schemas: {
            Post: {
                type: 'object',
                required: ['title', 'body', 'price'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Unique identifier',
                        example: '507f1f77bcf86cd799439011'
                    },
                    title: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 100,
                        description: 'Post title',
                        example: 'Amazing Product'
                    },
                    body: {
                        type: 'string',
                        minLength: 10,
                        maxLength: 1000,
                        description: 'Post content',
                        example: 'This is an amazing product with great features...'
                    },
                    price: {
                        type: 'number',
                        minimum: 0,
                        description: 'Product price',
                        example: 99.99
                    },
                    image: {
                        type: 'string',
                        nullable: true,
                        description: 'Image filename',
                        example: 'uuid-filename.jpg'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp'
                    }
                }
            },
            PostInput: {
                type: 'object',
                required: ['title', 'body', 'price'],
                properties: {
                    title: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 100,
                        description: 'Post title',
                        example: 'Amazing Product'
                    },
                    body: {
                        type: 'string',
                        minLength: 10,
                        maxLength: 1000,
                        description: 'Post content',
                        example: 'This is an amazing product with great features...'
                    },
                    price: {
                        type: 'number',
                        minimum: 0,
                        description: 'Product price',
                        example: 99.99
                    }
                }
            },
            PostUpdateInput: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 100,
                        description: 'Post title',
                        example: 'Updated Product Title'
                    },
                    body: {
                        type: 'string',
                        minLength: 10,
                        maxLength: 1000,
                        description: 'Post content',
                        example: 'Updated product description...'
                    },
                    price: {
                        type: 'number',
                        minimum: 0,
                        description: 'Product price',
                        example: 89.99
                    }
                }
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true
                    },
                    message: {
                        type: 'string',
                        example: 'Operation completed successfully'
                    },
                    data: {
                        oneOf: [
                            { $ref: '#/components/schemas/Post' },
                            {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Post' }
                            }
                        ]
                    },
                    count: {
                        type: 'integer',
                        description: 'Number of items (for arrays)',
                        example: 10
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-08-27T06:09:31.282Z'
                    }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false
                    },
                    message: {
                        type: 'string',
                        example: 'Error description'
                    },
                    error: {
                        type: 'string',
                        example: 'Detailed error information'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-08-27T06:09:31.282Z'
                    }
                }
            },
            ValidationErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false
                    },
                    message: {
                        type: 'string',
                        example: 'Validation failed'
                    },
                    errors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: {
                                    type: 'string',
                                    example: 'title'
                                },
                                message: {
                                    type: 'string',
                                    example: 'Title is required'
                                },
                                value: {
                                    type: 'string',
                                    example: ''
                                }
                            }
                        }
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-08-27T06:09:31.282Z'
                    }
                }
            }
        },
        responses: {
            Success: {
                description: 'Successful operation',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SuccessResponse' }
                    }
                }
            },
            Created: {
                description: 'Resource created successfully',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SuccessResponse' }
                    }
                }
            },
            BadRequest: {
                description: 'Bad request - validation error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            TooManyRequests: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            InternalServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Posts',
            description: 'Post management operations'
        },
        {
            name: 'Static Files',
            description: 'Static file serving operations'
        },
        {
            name: 'System',
            description: 'System and health check endpoints'
        }
    ]
};

const options = {
    definition: swaggerDefinition,
    apis: [
        './src/router/*.js',
        './app.js'
    ], // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = specs;
