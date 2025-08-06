const { Pool } = require('pg')
const path = require('path')

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development'
const envFile = `.env.${nodeEnv}`
const envPath = path.resolve(__dirname, '..', envFile)

// Try to load environment-specific file first, fallback to .env
try {
  require('dotenv').config({ path: envPath })
  console.log(`🔧 Loaded environment configuration from ${envFile}`)
} catch (error) {
  // Fallback to default .env file
  require('dotenv').config()
  console.log('🔧 Loaded default environment configuration from .env')
}

class DatabaseConfig {
  constructor() {
    this.pool = null
    this.isConnected = false
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'red_vs_blue',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: 20, // Maximum number of clients in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // SSL configuration for production
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })

      console.log(this.pool);

      // Test the connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      
      this.isConnected = true
      console.log('✅ Database connected successfully')
      
      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('❌ Unexpected error on idle client', err)
        this.isConnected = false
      })

      return this.pool
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      this.isConnected = false
      throw error
    }
  }

  /**
   * Get database pool instance
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call connect() first.')
    }
    return this.pool
  }

  /**
   * Execute a query with error handling
   */
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected')
    }

    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Query executed in ${duration}ms:`, text.substring(0, 100))
      }
      
      return result
    } catch (error) {
      console.error('❌ Query error:', error.message)
      console.error('Query:', text)
      console.error('Params:', params)
      throw error
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    const client = await this.pool.connect()
    await client.query('BEGIN')
    return client
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client) {
    try {
      await client.query('COMMIT')
    } finally {
      client.release()
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client) {
    try {
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end()
      this.isConnected = false
      console.log('🔌 Database connection closed')
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.query('SELECT 1')
      return { status: 'healthy', connected: this.isConnected }
    } catch (error) {
      return { status: 'unhealthy', error: error.message, connected: false }
    }
  }
}

// Singleton instance
const dbConfig = new DatabaseConfig()

module.exports = dbConfig
