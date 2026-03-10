const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CLAW ID API',
      version: '2.0.0',
      description: 'AI身份管理平台API文档',
      contact: {
        name: 'CLAW AI',
        email: 'support@claw.id'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.claw.id',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Agent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            email: { type: 'string' },
            apiKey: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            platforms: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
