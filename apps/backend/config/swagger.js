const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger configuration for Red vs Blue API
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Red vs Blue API',
      version: '2.0.0',
      description: `
        A professional-grade counter application with PostgreSQL persistence, 
        real-time WebSocket communication, and enterprise-level architecture patterns.
        
        ## Features
        - PostgreSQL persistence with connection pooling
        - Real-time WebSocket communication
        - RESTful API with comprehensive error handling
        - Database migrations and schema management
        - Counter history and analytics
        - Rate limiting and security middleware
        - Health checks and monitoring
        
        ## WebSocket
        Connect to \`ws://localhost:3000\` for real-time counter updates.
        
        ## Rate Limits
        - General endpoints: 100 requests per 15 minutes
        - Counter increments: 30 requests per minute
        - Admin actions: 5 requests per hour
      `,
      contact: {
        name: 'Red vs Blue API Support',
        email: 'support@redvsblue.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://red-vs-blue-basic.onrender.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and system status endpoints'
      },
      {
        name: 'Counters',
        description: 'Counter operations and management'
      },
      {
        name: 'Analytics',
        description: 'Statistics and historical data'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (restricted)'
      },
      {
        name: 'WebSocket',
        description: 'Real-time WebSocket communication'
      }
    ],
    components: {
      schemas: {
        Counter: {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'blue'],
              description: 'The counter color'
            },
            count: {
              type: 'integer',
              minimum: 0,
              description: 'Current counter value'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CounterUpdate: {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'blue']
            },
            previousCount: {
              type: 'integer',
              minimum: 0
            },
            newCount: {
              type: 'integer',
              minimum: 0
            },
            incrementBy: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        IncrementRequest: {
          type: 'object',
          properties: {
            incrementBy: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 1,
              description: 'Amount to increment by'
            },
            sessionId: {
              type: 'string',
              description: 'Optional session identifier'
            }
          }
        },
        BatchIncrementRequest: {
          type: 'object',
          required: ['increments'],
          properties: {
            increments: {
              type: 'array',
              items: {
                type: 'object',
                required: ['color'],
                properties: {
                  color: {
                    type: 'string',
                    enum: ['red', 'blue']
                  },
                  incrementBy: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 1
                  }
                }
              },
              minItems: 1,
              maxItems: 10
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy']
            },
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['healthy', 'unhealthy']
                }
              }
            },
            counters: {
              type: 'object',
              properties: {
                red: {
                  type: 'integer'
                },
                blue: {
                  type: 'integer'
                }
              }
            },
            lastUpdated: {
              type: 'integer',
              description: 'Unix timestamp of last update'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Statistics: {
          type: 'object',
          properties: {
            timeRange: {
              type: 'string',
              description: 'Time range for statistics'
            },
            stats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  color: {
                    type: 'string',
                    enum: ['red', 'blue']
                  },
                  current_count: {
                    type: 'integer'
                  },
                  total_increments: {
                    type: 'string'
                  },
                  total_increment_amount: {
                    type: 'string'
                  },
                  avg_increment: {
                    type: 'string'
                  },
                  first_increment: {
                    type: 'string',
                    format: 'date-time'
                  },
                  last_increment: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                totalCount: {
                  type: 'integer'
                },
                totalIncrements: {
                  type: 'string'
                },
                leader: {
                  type: 'string',
                  enum: ['red', 'blue', 'tie']
                },
                leaderCount: {
                  type: 'integer'
                },
                difference: {
                  type: 'integer'
                }
              }
            },
            insights: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
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
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - Invalid input parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './docs/*.js'
  ]
};

// Generate swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Setup Swagger middleware
 */
function setupSwagger(app) {
  // Serve swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Red vs Blue API Documentation',
    swaggerOptions: {
      docExpansion: 'none',
      defaultModelExpandDepth: 2,
      defaultModelsExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  }));

  // Serve raw swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}

module.exports = {
  setupSwagger,
  swaggerSpec
};
