# Red vs Blue - Enterprise Edition

A professional-grade counter application with PostgreSQL persistence, real-time WebSocket communication, and enterprise-level architecture patterns.

## 🏗️ Architecture Overview

This application follows enterprise software development best practices:

- **Layered Architecture**: Clear separation between presentation, business logic, and data layers
- **Repository Pattern**: Abstracted data access layer for clean database operations
- **Service Layer**: Business logic encapsulation with error handling
- **Dependency Injection**: Loose coupling between components
- **Database Migrations**: Version-controlled database schema management
- **WebSocket Manager**: Real-time communication with connection pooling
- **Comprehensive Error Handling**: Structured error responses and logging
- **Rate Limiting**: Protection against abuse
- **Health Checks**: Application and database monitoring
- **Graceful Shutdown**: Clean resource cleanup

### 📁 Project Structure

```text
red_vs_blue_basic/
├── apps/
│   ├── backend/
│   │   ├── config/
│   │   │   ├── database.js           # Database configuration and connection pooling
│   │   │   └── swagger.js           # Swagger/OpenAPI documentation setup
│   │   ├── controllers/
│   │   │   └── CounterController.js  # HTTP request handlers
│   │   ├── database/
│   │   │   └── migrations.js         # Database schema migrations
│   │   ├── docs/
│   │   │   └── websocket.js         # WebSocket API documentation
│   │   ├── middleware/
│   │   │   └── errorHandler.js       # Error handling and rate limiting
│   │   ├── repositories/
│   │   │   └── CounterRepository.js  # Data access layer
│   │   ├── routes/
│   │   │   └── api.js               # API route definitions
│   │   ├── scripts/
│   │   │   ├── env-compare.js       # Environment comparison tool
│   │   │   ├── env-manager.js       # Environment management utility
│   │   │   ├── init-db.js           # Database initialization
│   │   │   ├── test-architecture.js # Architecture testing
│   │   │   └── test-websocket.js    # WebSocket testing
│   │   ├── services/
│   │   │   └── CounterService.js    # Business logic layer
│   │   ├── test/
│   │   │   └── test-websocket.js    # WebSocket integration tests
│   │   ├── websocket/
│   │   │   └── WebSocketManager.js  # Real-time communication
│   │   ├── .env                     # Current environment variables
│   │   ├── .env.development         # Development environment config
│   │   ├── .env.production          # Production environment config
│   │   ├── .env.example            # Environment template
│   │   ├── docker-compose.yml      # Multi-service container orchestration
│   │   ├── Dockerfile              # Production container image
│   │   └── index.js                # Application entry point
│   └── frontend/
│       ├── Dockerfile              # Frontend container image
│       ├── index.html             # Main HTML page
│       └── script.js              # Frontend JavaScript
├── package.json                   # Node.js project configuration
└── README.md                     # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+ (or Docker)
- npm or yarn

### Option 1: Docker (Recommended)

1. **Clone and navigate to the project:**

   ```bash
   git clone <repository-url>
   cd red_vs_blue_basic
   ```

2. **Start all services with Docker:**

   ```bash
   npm run docker:up
   ```

3. **Initialize the database:**

   ```bash
   npm run db:init
   ```

4. **Access the application:**
   - Backend API: `http://localhost:3000`
   - WebSocket: `ws://localhost:3000`
   - Frontend: `http://localhost:8080`

### Option 2: Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start PostgreSQL:**

   ```bash
   npm run db:start
   ```

3. **Setup environment variables:**

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   # Edit .env with your database credentials
   ```

4. **Initialize the database:**

   ```bash
   npm run db:init
   ```

5. **Start the application:**

   ```bash
   npm run start:full
   ```

## 📊 Database Schema

### Counters Table

```sql
CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  color VARCHAR(10) NOT NULL UNIQUE CHECK (color IN ('red', 'blue')),
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Counter History Table

```sql
CREATE TABLE counter_history (
  id SERIAL PRIMARY KEY,
  color VARCHAR(10) NOT NULL CHECK (color IN ('red', 'blue')),
  previous_count INTEGER NOT NULL,
  new_count INTEGER NOT NULL,
  increment_amount INTEGER NOT NULL DEFAULT 1,
  client_info JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255)
);
```

## 🌐 API Endpoints

### 📚 Interactive API Documentation

The API includes comprehensive Swagger/OpenAPI documentation with interactive testing capabilities:

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI Spec**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

```bash
# Open documentation in browser (macOS/Linux)
npm run docs

# Get raw OpenAPI specification
npm run docs:json

# Test all documented endpoints
npm run test:api
```

### Testing & Integration

- **🧪 Automated Tests**: Run `npm run test:api` to test all endpoints
- **📮 Postman**: Import the OpenAPI spec at `/api-docs.json` into Postman
- **🔧 Insomnia**: Import the OpenAPI spec for REST client testing
- **⚡ curl Examples**: Every endpoint includes working curl examples

### Core Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|-------------|
| GET | `/api/health` | Health check | None |
| GET | `/api/status` | Application status | 100/15min |
| GET | `/api/counters` | Get current counter values | 100/15min |
| POST | `/api/red` | Increment red counter | 1000/sec |
| POST | `/api/blue` | Increment blue counter | 1000/sec |
| POST | `/api/counters/batch` | Batch increment counters | 1000/sec |
| GET | `/api/counters/stats` | Get statistics | 100/15min |
| GET | `/api/counters/history` | Get counter history | 100/15min |
| POST | `/api/counters/reset` | Reset all counters | 5/hour |

### API Features

- **📖 Interactive Documentation**: Full Swagger UI with try-it-out functionality
- **🔒 Rate Limiting**: Different limits for different endpoint types
- **📊 Comprehensive Responses**: Detailed error messages and structured data
- **⏱️ Request Validation**: Input validation with clear error messages
- **🏷️ OpenAPI 3.0**: Industry-standard API specification
- **🧪 Built-in Testing**: Test endpoints directly from the documentation

### Example API Usage

**Increment a counter:**

```bash
curl -X POST http://localhost:3000/api/red \
  -H "Content-Type: application/json" \
  -d '{"incrementBy": 1, "sessionId": "user123"}'
```

**Get statistics:**

```bash
curl "http://localhost:3000/api/counters/stats?timeRange=24%20hours"
```

**Batch increment:**

```bash
curl -X POST http://localhost:3000/api/counters/batch \
  -H "Content-Type: application/json" \
  -d '{
    "increments": [
      {"color": "red", "incrementBy": 2},
      {"color": "blue", "incrementBy": 1}
    ]
  }'
```

## 🔌 WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Message Types

**Client to Server:**

```javascript
// Get current counters
ws.send(JSON.stringify({ type: 'get_counters' }));

// Subscribe to updates
ws.send(JSON.stringify({ type: 'subscribe_updates' }));

// Get statistics
ws.send(JSON.stringify({ 
  type: 'get_stats', 
  timeRange: '24 hours' 
}));
```

**Server to Client:**

```javascript
// Counter update
{
  "type": "counter_update",
  "data": { "red": 42, "blue": 38 },
  "timestamp": "2025-01-08T12:00:00.000Z"
}

// Statistics update
{
  "type": "statistics_update",
  "data": {
    "timeRange": "24 hours",
    "stats": [...],
    "summary": {...}
  }
}
```

## � Environment Configuration

The application supports multiple environments with separate configuration files:

### Environment Files

- **`.env.development`** - Local development with Docker PostgreSQL
- **`.env.production`** - Production environment with remote database  
- **`.env`** - Current active configuration (copied from environment files)

### Environment Management Commands

```bash
# List available environments
npm run env:list

# Switch to development environment
npm run env:use:dev

# Switch to production environment  
npm run env:use:prod

# Show development configuration
npm run env:show:dev

# Show production configuration
npm run env:show:prod

# Validate current environment
npm run env:validate
```

### Manual Environment Management

You can also use the environment manager script directly:

```bash
cd apps/backend

# List all environments
node scripts/env-manager.js list

# Switch environments
node scripts/env-manager.js use development
node scripts/env-manager.js use production

# View environment configuration
node scripts/env-manager.js show development
node scripts/env-manager.js show production

# Validate current configuration
node scripts/env-manager.js validate
```

## �🛠️ Development Commands

```bash
# Development (local)
npm run backend:dev          # Start backend in development mode
npm run backend:local        # Start backend in local mode (alias for dev)
npm run start:dev           # Start both frontend and backend (development)
npm run start:full          # Start database + init + application (development)

# Production
npm run backend:prod         # Start backend in production mode  
npm run start:prod          # Start both frontend and backend (production)

# Frontend
npm run frontend            # Start frontend server

# Database
npm run db:start           # Start PostgreSQL with Docker
npm run db:stop            # Stop PostgreSQL
npm run db:reset           # Reset database (removes all data)
npm run db:init            # Initialize/migrate database (current environment)
npm run db:init:dev        # Initialize/migrate database (development)
npm run db:init:prod       # Initialize/migrate database (production)

# Environment Management
npm run env:list           # List available environments
npm run env:use:dev        # Switch to development environment
npm run env:use:prod       # Switch to production environment
npm run env:show:dev       # Show development configuration
npm run env:show:prod      # Show production configuration
npm run env:validate       # Validate current environment
npm run env:compare        # Compare development vs production environments

# Docker
npm run docker:build       # Build Docker images
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:logs        # View logs

# General
npm run start              # Start frontend and backend (development mode)
npm test                   # Run tests (placeholder)
npm run test:api           # Test all Swagger-documented API endpoints

# Documentation
npm run docs               # Open API documentation in browser
npm run docs:json          # Get raw OpenAPI specification
```

## 🔧 Configuration

### Development Environment

The development environment uses local Docker PostgreSQL:

```env
# .env.development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=red_vs_blue
DB_USER=postgres
DB_PASSWORD=password
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `DB_HOST` | Database host | `localhost` | Remote host |
| `DB_PORT` | Database port | `5432` | `5432` |
| `DB_NAME` | Database name | `red_vs_blue` | Production DB name |
| `DB_USER` | Database user | `postgres` | Production user |
| `DB_PASSWORD` | Database password | `password` | Production password |
| `NODE_ENV` | Environment | `development` | `production` |
| `PORT` | Application port | `3000` | `3000` |

## � Deployment Guide

### Local Development

1. **Setup environment:**

   ```bash
   npm run env:use:dev
   npm run env:validate
   ```

2. **Start database:**

   ```bash
   npm run db:start
   npm run db:init:dev
   ```

3. **Run application:**

   ```bash
   npm run start:dev
   ```

### Production Deployment

1. **Setup production environment:**

   ```bash
   npm run env:use:prod
   npm run env:validate
   ```

2. **Initialize production database:**

   ```bash
   npm run db:init:prod
   ```

3. **Start production server:**

   ```bash
   npm run backend:prod
   ```

### Docker Deployment

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## �📈 Features

### Current Features

- ✅ PostgreSQL persistence with connection pooling
- ✅ Real-time WebSocket communication
- ✅ RESTful API with comprehensive error handling
- ✅ Interactive Swagger/OpenAPI documentation
- ✅ Database migrations and schema management
- ✅ Counter history and analytics
- ✅ Rate limiting and security middleware
- ✅ Health checks and monitoring
- ✅ Docker containerization
- ✅ Graceful shutdown handling
- ✅ Structured logging
- ✅ Environment management system

### Enterprise Features

- 🏗️ **Layered Architecture**: Repository, Service, Controller pattern
- 🔄 **Database Transactions**: ACID compliance for counter operations
- 📊 **Analytics**: Historical data tracking and insights
- � **API Documentation**: Interactive Swagger/OpenAPI documentation with testing
- �🛡️ **Security**: Rate limiting, input validation, SQL injection protection
- 🔍 **Monitoring**: Health checks, error tracking, performance metrics
- 🐳 **DevOps**: Docker, Docker Compose, production-ready containers
- 📈 **Scalability**: Connection pooling, efficient queries, background processing

## 🧪 Testing

The application includes comprehensive error handling and can be tested using:

```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/api/counters
curl -X POST http://localhost:3000/api/red

# Test WebSocket
# Use a WebSocket client to connect to ws://localhost:3000
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests
- **Error Sanitization**: Prevents information leakage
- **Non-root Docker User**: Container security
- **Health Checks**: Application monitoring

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes following the existing architecture patterns
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
