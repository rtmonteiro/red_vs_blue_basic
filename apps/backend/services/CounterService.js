const CounterRepository = require('../repositories/CounterRepository')

/**
 * Counter Service
 * Implements business logic for counter operations
 * Acts as an intermediary between controllers and repositories
 */
class CounterService {
  constructor() {
    this.counterRepository = new CounterRepository()
    this.validColors = ['red', 'blue']
  }

  /**
   * Get current counter values
   */
  async getCurrentCounters() {
    try {
      const result = await this.counterRepository.getCounters()
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ CounterService.getCurrentCounters error:', error.message)
      return {
        success: false,
        error: 'Failed to retrieve counter values',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Increment a specific counter
   */
  async incrementCounter(color, options = {}) {
    try {
      // Validate color
      if (!this.isValidColor(color)) {
        return {
          success: false,
          error: `Invalid color '${color}'. Valid colors are: ${this.validColors.join(', ')}`
        }
      }

      const {
        incrementBy = 1,
        clientInfo = null,
        sessionId = null
      } = options

      // Validate increment amount
      if (!Number.isInteger(incrementBy) || incrementBy < 1) {
        return {
          success: false,
          error: 'Increment amount must be a positive integer'
        }
      }

      // Prepare client info
      const enrichedClientInfo = {
        ...clientInfo,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: clientInfo?.userAgent || null,
        ipAddress: clientInfo?.ipAddress || null
      }

      const result = await this.counterRepository.incrementCounter(
        color, 
        incrementBy, 
        enrichedClientInfo
      )

      return {
        success: true,
        data: result,
        message: `${color} counter incremented successfully`
      }

    } catch (error) {
      console.error(`❌ CounterService.incrementCounter(${color}) error:`, error.message)
      return {
        success: false,
        error: `Failed to increment ${color} counter`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }

  /**
   * Batch increment multiple counters
   */
  async batchIncrementCounters(increments) {
    const results = []
    const errors = []

    for (const { color, incrementBy = 1, clientInfo = null } of increments) {
      try {
        const result = await this.incrementCounter(color, { incrementBy, clientInfo })
        if (result.success) {
          results.push(result.data)
        } else {
          errors.push({ color, error: result.error })
        }
      } catch (error) {
        errors.push({ color, error: error.message })
      }
    }

    return {
      success: errors.length === 0,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: increments.length,
          successful: results.length,
          failed: errors.length
        }
      }
    }
  }

  /**
   * Reset all counters
   */
  async resetAllCounters(adminInfo = null) {
    try {
      const result = await this.counterRepository.resetCounters()
      
      // Log admin action
      if (adminInfo) {
        console.log('🔄 Admin reset action:', {
          admin: adminInfo,
          timestamp: new Date().toISOString()
        })
      }

      return {
        success: true,
        data: result,
        message: 'All counters have been reset to zero'
      }

    } catch (error) {
      console.error('❌ CounterService.resetAllCounters error:', error.message)
      return {
        success: false,
        error: 'Failed to reset counters',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }

  /**
   * Get counter statistics
   */
  async getCounterStatistics(timeRange = '24 hours') {
    try {
      const stats = await this.counterRepository.getCounterStats(timeRange)
      
      // Calculate additional metrics
      const enrichedStats = {
        ...stats,
        summary: this.calculateSummaryMetrics(stats.stats),
        insights: this.generateInsights(stats.stats)
      }

      return {
        success: true,
        data: enrichedStats
      }

    } catch (error) {
      console.error('❌ CounterService.getCounterStatistics error:', error.message)
      return {
        success: false,
        error: 'Failed to retrieve counter statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }

  /**
   * Get counter history with filtering
   */
  async getCounterHistory(filters = {}) {
    try {
      const {
        color,
        limit = 50,
        offset = 0,
        startDate,
        endDate
      } = filters

      // Validate color if provided
      if (color && !this.isValidColor(color)) {
        return {
          success: false,
          error: `Invalid color '${color}'. Valid colors are: ${this.validColors.join(', ')}`
        }
      }

      const history = await this.counterRepository.getCounterHistory({
        color,
        limit: Math.min(limit, 1000), // Cap limit to prevent abuse
        offset: Math.max(offset, 0),
        startDate,
        endDate
      })

      return {
        success: true,
        data: history
      }

    } catch (error) {
      console.error('❌ CounterService.getCounterHistory error:', error.message)
      return {
        success: false,
        error: 'Failed to retrieve counter history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      const dbHealth = await this.counterRepository.healthCheck()
      const counters = await this.counterRepository.getCounters()
      
      return {
        status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        database: dbHealth,
        counters: counters.counters,
        lastUpdated: counters.lastUpdated,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Validate if color is supported
   */
  isValidColor(color) {
    return this.validColors.includes(color?.toLowerCase())
  }

  /**
   * Calculate summary metrics from stats
   */
  calculateSummaryMetrics(stats) {
    const total = stats.reduce((sum, stat) => sum + stat.current_count, 0)
    const totalIncrements = stats.reduce((sum, stat) => sum + stat.total_increments, 0)
    
    const leader = stats.reduce((prev, current) => 
      current.current_count > prev.current_count ? current : prev
    )

    return {
      totalCount: total,
      totalIncrements,
      leader: leader.color,
      leaderCount: leader.current_count,
      difference: Math.abs(stats[0]?.current_count - stats[1]?.current_count) || 0
    }
  }

  /**
   * Generate insights from statistics
   */
  generateInsights(stats) {
    const insights = []
    
    if (stats.length >= 2) {
      const [stat1, stat2] = stats
      const diff = Math.abs(stat1.current_count - stat2.current_count)
      
      if (diff === 0) {
        insights.push("It's a perfect tie!")
      } else if (diff > 100) {
        insights.push(`${stat1.current_count > stat2.current_count ? stat1.color : stat2.color} is dominating with a lead of ${diff}`)
      } else if (diff > 10) {
        insights.push(`Close competition with ${stat1.current_count > stat2.current_count ? stat1.color : stat2.color} slightly ahead`)
      }
    }
    
    return insights
  }
}

module.exports = CounterService
