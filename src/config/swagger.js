const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IMF Gadget API',
      version: '1.0.0',
      description:
        'Mission: Impossible-themed API for managing IMF gadgets. Register or log in, then click Authorize and paste the token.',
    },
    servers: [
      {
        url: '/',
        description: 'Current host',
      },
      {
        url: 'https://imf-gadget-api-dhbc.onrender.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')], // JSDoc-annotated route files
};

module.exports = swaggerJsdoc(options);
