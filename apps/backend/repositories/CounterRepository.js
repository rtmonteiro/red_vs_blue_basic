const dbConfig = require('../config/database')

/**
 * Counter Repository
 * Handles all database operations related to counters
 * Implements Repository Pattern for clean separation of concerns
 */
class CounterRepository {
  /**
   * Get current counter values for both colors
   */
  async getCounters() {
    try {
      const result = await dbConfig.query(`
        SELECT color, count, updated_at 
        FROM counters 
        ORDER BY color
      `)
      
      // Transform to object format for compatibility
      const counters = {}
      result.rows.forEach(row => {
        counters[row.color] = row.count
      })
      
      return {
        counters,
        lastUpdated: result.rows.length > 0 ? 
          Math.max(...result.rows.map(r => new Date(r.updated_at).getTime())) : 
          null
      }
    } catch (error) {
      console.error('❌ Error fetching counters:', error.message)
      throw new Error('Failed to fetch counter values')
    }
  }

  /**
   * Get counter value for a specific color
   */
  async getCounterByColor(color) {
    try {
      const result = await dbConfig.query(`
        SELECT color, count, updated_at 
        FROM counters 
        WHERE color = $1
      `, [color])
      
      if (result.rows.length === 0) {
        throw new Error(`Counter for color '${color}' not found`)
      }
      
      return result.rows[0]
    } catch (error) {
      console.error(`❌ Error fetching ${color} counter:`, error.message)
      throw error
    }
  }

  /**
   * Increment counter for a specific color
   * Uses database transaction for consistency
   */
  async incrementCounter(color, incrementBy = 1, clientInfo = null) {
    const client = await dbConfig.beginTransaction()
    
    try {
      // Get current value
      const currentResult = await client.query(`
        SELECT count FROM counters WHERE color = $1 FOR UPDATE
      `, [color])
      
      if (currentResult.rows.length === 0) {
        throw new Error(`Counter for color '${color}' not found`)
      }
      
      const previousCount = currentResult.rows[0].count
      const newCount = previousCount + incrementBy
      
      // Update counter
      await client.query(`
        UPDATE counters 
        SET count = $1 
        WHERE color = $2
      `, [newCount, color])

      await dbConfig.commitTransaction(client)
      
      return {
        color,
        previousCount,
        newCount,
        incrementBy,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      await dbConfig.rollbackTransaction(client)
      console.error(`❌ Error incrementing ${color} counter:`, error.message)
      throw new Error(`Failed to increment ${color} counter`)
    }
  }

  /**
   * Reset all counters to zero
   */
  async resetCounters() {
    const client = await dbConfig.beginTransaction()
    
    try {
      // Get current values for history
      const currentResult = await client.query('SELECT color, count FROM counters')
      
      // Reset counters
      await client.query('UPDATE counters SET count = 0')
      
      // Record reset in history
      for (const row of currentResult.rows) {
        await client.query(`
          INSERT INTO counter_history 
          (color, previous_count, new_count, increment_amount, client_info) 
          VALUES ($1, $2, 0, $3, $4)
        `, [row.color, row.count, -row.count, { action: 'reset' }])
      }
      
      await dbConfig.commitTransaction(client)
      
      return { message: 'All counters reset to zero', timestamp: new Date().toISOString() }
      
    } catch (error) {
      await dbConfig.rollbackTransaction(client)
      console.error('❌ Error resetting counters:', error.message)
      throw new Error('Failed to reset counters')
    }
  }

  /**
   * Get counter statistics and analytics
   */
  async getCounterStats(timeRange = '24 hours') {
    try {
      const timeQuery = this.getTimeRangeQuery(timeRange)
      
      const result = await dbConfig.query(`
        WITH stats AS (
          SELECT 
            color,
            COUNT(*) as total_increments,
            SUM(increment_amount) as total_increment_amount,
            AVG(increment_amount) as avg_increment,
            MIN(timestamp) as first_increment,
            MAX(timestamp) as last_increment
          FROM counter_history 
          WHERE timestamp >= ${timeQuery}
          GROUP BY color
        ),
        current_values AS (
          SELECT color, count as current_count 
          FROM counters
        )
        SELECT 
          cv.color,
          cv.current_count,
          COALESCE(s.total_increments, 0) as total_increments,
          COALESCE(s.total_increment_amount, 0) as total_increment_amount,
          COALESCE(s.avg_increment, 0) as avg_increment,
          s.first_increment,
          s.last_increment
        FROM current_values cv
        LEFT JOIN stats s ON cv.color = s.color
        ORDER BY cv.color
      `)
      
      return {
        timeRange,
        stats: result.rows,
        generatedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('❌ Error fetching counter stats:', error.message)
      throw new Error('Failed to fetch counter statistics')
    }
  }

  /**
   * Get counter history with pagination
   */
  async getCounterHistory(options = {}) {
    try {
      const {
        color = null,
        limit = 100,
        offset = 0,
        startDate = null,
        endDate = null
      } = options
      
      let query = `
        SELECT 
          id, color, previous_count, new_count, increment_amount, 
          client_info, timestamp, session_id
        FROM counter_history
        WHERE 1=1
      `
      const params = []
      let paramCount = 0
      
      if (color) {
        query += ` AND color = $${++paramCount}`
        params.push(color)
      }
      
      if (startDate) {
        query += ` AND timestamp >= $${++paramCount}`
        params.push(startDate)
      }
      
      if (endDate) {
        query += ` AND timestamp <= $${++paramCount}`
        params.push(endDate)
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`
      params.push(limit, offset)
      
      const result = await dbConfig.query(query, params)
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM counter_history WHERE 1=1'
      const countParams = []
      let countParamCount = 0
      
      if (color) {
        countQuery += ` AND color = $${++countParamCount}`
        countParams.push(color)
      }
      
      if (startDate) {
        countQuery += ` AND timestamp >= $${++countParamCount}`
        countParams.push(startDate)
      }
      
      if (endDate) {
        countQuery += ` AND timestamp <= $${++countParamCount}`
        countParams.push(endDate)
      }
      
      const countResult = await dbConfig.query(countQuery, countParams)
      const totalCount = parseInt(countResult.rows[0].count)
      
      return {
        history: result.rows,
        pagination: {
          limit,
          offset,
          totalCount,
          hasMore: offset + limit < totalCount
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching counter history:', error.message)
      throw new Error('Failed to fetch counter history')
    }
  }

  /**
   * Helper method to generate time range queries
   */
  getTimeRangeQuery(timeRange) {
    const ranges = {
      '1 hour': "NOW() - INTERVAL '1 hour'",
      '24 hours': "NOW() - INTERVAL '24 hours'",
      '7 days': "NOW() - INTERVAL '7 days'",
      '30 days': "NOW() - INTERVAL '30 days'",
      '1 year': "NOW() - INTERVAL '1 year'"
    }
    
    return ranges[timeRange] || ranges['24 hours']
  }

  /**
   * Health check for repository
   */
  async healthCheck() {
    try {
      await dbConfig.query('SELECT 1 FROM counters LIMIT 1')
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

module.exports = CounterRepository
