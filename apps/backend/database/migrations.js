const dbConfig = require('../config/database')

/**
 * Database Migration Manager
 * Handles database schema migrations and initialization
 */
class MigrationManager {
  constructor() {
    this.migrations = [
      {
        version: '001',
        name: 'create_counters_table',
        up: this.createCountersTable,
        down: this.dropCountersTable
      },
      {
        version: '002',
        name: 'create_counter_history_table',
        up: this.createCounterHistoryTable,
        down: this.dropCounterHistoryTable
      }
    ]
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    try {
      console.log('🚀 Starting database migrations...')
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()
      
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations()
      
      // Run pending migrations
      for (const migration of this.migrations) {
        if (!appliedMigrations.includes(migration.version)) {
          console.log(`📦 Running migration ${migration.version}: ${migration.name}`)
          await migration.up.call(this)
          await this.recordMigration(migration.version, migration.name)
          console.log(`✅ Migration ${migration.version} completed`)
        }
      }
      
      console.log('🎉 All migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error.message)
      throw error
    }
  }

  /**
   * Create migrations tracking table
   */
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await dbConfig.query(query)
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations() {
    const result = await dbConfig.query('SELECT version FROM migrations ORDER BY applied_at')
    return result.rows.map(row => row.version)
  }

  /**
   * Record a completed migration
   */
  async recordMigration(version, name) {
    await dbConfig.query(
      'INSERT INTO migrations (version, name) VALUES ($1, $2)',
      [version, name]
    )
  }

  /**
   * Migration 001: Create counters table
   */
  async createCountersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS counters (
        id SERIAL PRIMARY KEY,
        color VARCHAR(10) NOT NULL UNIQUE CHECK (color IN ('red', 'blue')),
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert initial values
      INSERT INTO counters (color, count) VALUES 
        ('red', 0), 
        ('blue', 0) 
      ON CONFLICT (color) DO NOTHING;

      -- Create trigger for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_counters_updated_at ON counters;
      CREATE TRIGGER update_counters_updated_at 
        BEFORE UPDATE ON counters 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `
    await dbConfig.query(query)
  }

  /**
   * Migration 002: Create counter history table for analytics
   */
  async createCounterHistoryTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS counter_history (
        id SERIAL PRIMARY KEY,
        color VARCHAR(10) NOT NULL CHECK (color IN ('red', 'blue')),
        previous_count INTEGER NOT NULL,
        new_count INTEGER NOT NULL,
        increment_amount INTEGER NOT NULL DEFAULT 1,
        client_info JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255)
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_counter_history_color ON counter_history(color);
      CREATE INDEX IF NOT EXISTS idx_counter_history_timestamp ON counter_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_counter_history_session ON counter_history(session_id);
    `
    await dbConfig.query(query)
  }

  /**
   * Rollback migration 001
   */
  async dropCountersTable() {
    await dbConfig.query('DROP TABLE IF EXISTS counters CASCADE')
    await dbConfig.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE')
  }

  /**
   * Rollback migration 002
   */
  async dropCounterHistoryTable() {
    await dbConfig.query('DROP TABLE IF EXISTS counter_history CASCADE')
  }

  /**
   * Rollback to a specific migration version
   */
  async rollback(targetVersion) {
    try {
      console.log(`🔄 Rolling back to migration version ${targetVersion}`)
      
      const appliedMigrations = await this.getAppliedMigrations()
      const reverseMigrations = [...this.migrations].reverse()
      
      for (const migration of reverseMigrations) {
        if (appliedMigrations.includes(migration.version) && 
            migration.version > targetVersion) {
          console.log(`🔄 Rolling back migration ${migration.version}`)
          await migration.down.call(this)
          await dbConfig.query(
            'DELETE FROM migrations WHERE version = $1',
            [migration.version]
          )
          console.log(`✅ Rollback ${migration.version} completed`)
        }
      }
      
      console.log('🎉 Rollback completed successfully')
    } catch (error) {
      console.error('❌ Rollback failed:', error.message)
      throw error
    }
  }
}

module.exports = MigrationManager
