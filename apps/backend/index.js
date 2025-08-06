const path = require('path')

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development'
const envFile = `.env.${nodeEnv}`
const envPath = path.resolve(__dirname, envFile)

// Try to load environment-specific file first, fallback to .env
try {
  require('dotenv').config({ path: envPath })
  console.log(`🔧 Loaded environment configuration from ${envFile}`)
} catch (error) {
  // Fallback to default .env file
  require('dotenv').config()
  console.log('🔧 Loaded default environment configuration from .env')
}

const express = require('express')
const http = require('http')
const dbConfig = require('./config/database')
const MigrationManager = require('./database/migrations')
const WebSocketManager = require('./websocket/WebSocketManager')
const apiRoutes = require('./routes/api')
const { 
  errorHandler, 
  notFound, 
  requestLogger 
} = require('./middleware/errorHandler')

const app = express()
const port = process.env.PORT || 3000

// Global middleware
app.use(requestLogger)

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Trust proxy for accurate IP addresses
app.set('trust proxy', true)

// Create HTTP server
const server = http.createServer(app)

// Initialize WebSocket manager
let wsManager

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Red vs Blue API!',
    version: '2.0.0',
    endpoints: {
      counters: '/api/counters',
      red: '/api/red',
      blue: '/api/blue',
      stats: '/api/counters/stats',
      health: '/api/health'
    },
    websocket: `ws://localhost:${port}`,
    timestamp: new Date().toISOString()
  })
})

// Store WebSocket manager reference for access in routes
app.use((req, res, next) => {
  req.wsManager = wsManager
  req.app.set('connectedClients', wsManager ? wsManager.getConnectedClientsCount() : 0)
  next()
})

// API routes
app.use('/api', apiRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    console.log('🚀 Starting Red vs Blue API server...')
    
    // Connect to database
    console.log('📦 Connecting to database...')
    await dbConfig.connect()
    
    // Run database migrations
    console.log('🔄 Running database migrations...')
    const migrationManager = new MigrationManager()
    await migrationManager.migrate()
    
    // Initialize WebSocket manager
    console.log('🔌 Initializing WebSocket server...')
    wsManager = new WebSocketManager(server)
    
    // Start server
    server.listen(port, () => {
      console.log('✅ Server initialization completed!')
      console.log(`🌐 HTTP Server running at http://localhost:${port}`)
      console.log(`🔌 WebSocket server running at ws://localhost:${port}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Database: Connected to PostgreSQL`)
    })
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error.message)
    process.exit(1)
  }
}

/**
 * Handle graceful shutdown
 */
async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`)
  
  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed')
    })
    
    // Close WebSocket connections
    if (wsManager) {
      await wsManager.shutdown()
    }
    
    // Close database connection
    await dbConfig.close()
    
    console.log('✅ Graceful shutdown completed')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message)
    process.exit(1)
  }
}

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`)
  } else {
    console.error('❌ Server error:', err)
  }
  process.exit(1)
})

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('unhandledRejection')
})

// Start the application
initializeApp()

// Broadcast counter updates when counters change
function broadcastCounterUpdate() {
  if (wsManager) {
    wsManager.broadcastCounterUpdate()
  }
}

// Export for testing
module.exports = { app, server, initializeApp, broadcastCounterUpdate }
