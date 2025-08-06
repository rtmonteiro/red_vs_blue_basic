#!/usr/bin/env node

/**
 * Database initialization script
 * Sets up the database, runs migrations, and seeds initial data
 */

const dbConfig = require('../config/database')
const MigrationManager = require('../database/migrations')

async function initializeDatabase() {
  console.log('🚀 Initializing database...')
  
  try {
    // Connect to database
    await dbConfig.connect()
    
    // Run migrations
    const migrationManager = new MigrationManager()
    await migrationManager.migrate()
    
    // Verify setup
    await verifySetup()
    
    console.log('🎉 Database initialization completed successfully!')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    process.exit(1)
  } finally {
    await dbConfig.close()
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...')
  
  try {
    // Check if counters table exists and has data
    const result = await dbConfig.query('SELECT * FROM counters ORDER BY color')
    
    if (result.rows.length === 2) {
      console.log('✅ Counters table setup correctly:')
      result.rows.forEach(row => {
        console.log(`   ${row.color}: ${row.count}`)
      })
    } else {
      throw new Error('Counters table not properly initialized')
    }
    
    // Check migrations table
    const migrationResult = await dbConfig.query('SELECT * FROM migrations ORDER BY applied_at')
    console.log(`✅ ${migrationResult.rows.length} migrations applied`)
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase, verifySetup }
