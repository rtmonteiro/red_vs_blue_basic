const CounterService = require('../services/CounterService')
const { asyncHandler } = require('../middleware/errorHandler')

/**
 * Counter Controller
 * Handles HTTP requests for counter operations
 */
class CounterController {
  constructor() {
    this.counterService = new CounterService()
  }

  /**
   * Get current counter values
   * GET /api/counters
   */
  getCounters = asyncHandler(async (req, res) => {
    const result = await this.counterService.getCurrentCounters()
    
    if (!result.success) {
      return res.status(500).json(result)
    }
    
    res.json({
      success: true,
      data: {
        counters: result.data.counters,
        lastUpdated: result.data.lastUpdated,
        timestamp: result.timestamp
      }
    })
  })

  /**
   * Increment red counter
   * POST /api/red
   */
  incrementRed = asyncHandler(async (req, res) => {
    const clientInfo = this.extractClientInfo(req)
    const options = {
      incrementBy: req.body?.incrementBy || 1,
      clientInfo,
      sessionId: req.body?.sessionId || req.sessionID
    }
    
    const result = await this.counterService.incrementCounter('red', options)
    
    if (!result.success) {
      return res.status(400).json(result)
    }
    
    // Broadcast WebSocket update to all connected clients
    if (req.wsManager) {
      await req.wsManager.broadcastCounterUpdate()
    }
    
    res.json({
      success: true,
      message: `Red activated ${result.data.newCount} times`,
      data: result.data
    })
  })

  /**
   * Increment blue counter
   * POST /api/blue
   */
  incrementBlue = asyncHandler(async (req, res) => {
    const clientInfo = this.extractClientInfo(req)
    const options = {
      incrementBy: req.body?.incrementBy || 1,
      clientInfo,
      sessionId: req.body?.sessionId || req.sessionID
    }
    
    const result = await this.counterService.incrementCounter('blue', options)
    
    if (!result.success) {
      return res.status(400).json(result)
    }
    
    // Broadcast WebSocket update to all connected clients
    if (req.wsManager) {
      await req.wsManager.broadcastCounterUpdate()
    }
    
    res.json({
      success: true,
      message: `Blue activated ${result.data.newCount} times`,
      data: result.data
    })
  })

  /**
   * Batch increment multiple counters
   * POST /api/counters/batch
   */
  batchIncrement = asyncHandler(async (req, res) => {
    const { increments } = req.body
    
    if (!Array.isArray(increments) || increments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'increments must be a non-empty array'
      })
    }
    
    // Add client info to each increment
    const enrichedIncrements = increments.map(inc => ({
      ...inc,
      clientInfo: this.extractClientInfo(req)
    }))
    
    const result = await this.counterService.batchIncrementCounters(enrichedIncrements)
    
    // Broadcast WebSocket update to all connected clients if any increments succeeded
    if (result.success && req.wsManager) {
      await req.wsManager.broadcastCounterUpdate()
    }
    
    res.status(result.success ? 200 : 207).json(result)
  })

  /**
   * Reset all counters (admin only)
   * POST /api/counters/reset
   */
  resetCounters = asyncHandler(async (req, res) => {
    const adminInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }
    
    const result = await this.counterService.resetAllCounters(adminInfo)
    
    if (!result.success) {
      return res.status(500).json(result)
    }
    
    // Broadcast WebSocket update to all connected clients
    if (req.wsManager) {
      await req.wsManager.broadcastCounterUpdate()
    }
    
    res.json(result)
  })

  /**
   * Get counter statistics
   * GET /api/counters/stats
   */
  getStatistics = asyncHandler(async (req, res) => {
    const timeRange = req.query.timeRange || '24 hours'
    const result = await this.counterService.getCounterStatistics(timeRange)
    
    if (!result.success) {
      return res.status(500).json(result)
    }
    
    res.json(result)
  })

  /**
   * Get counter history
   * GET /api/counters/history
   */
  getHistory = asyncHandler(async (req, res) => {
    const filters = {
      color: req.query.color,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }
    
    const result = await this.counterService.getCounterHistory(filters)
    
    if (!result.success) {
      return res.status(400).json(result)
    }
    
    res.json(result)
  })

  /**
   * Health check endpoint
   * GET /api/health
   */
  healthCheck = asyncHandler(async (req, res) => {
    const health = await this.counterService.getHealthStatus()
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    res.status(statusCode).json(health)
  })

  /**
   * Get API status and information
   * GET /api/status
   */
  getStatus = asyncHandler(async (req, res) => {
    const result = await this.counterService.getCurrentCounters()
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Unable to fetch counter status'
      })
    }
    
    res.json({
      success: true,
      data: {
        counters: result.data.counters,
        connectedClients: req.app.get('connectedClients') || 0,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      }
    })
  })

  /**
   * Extract client information from request
   */
  extractClientInfo(req) {
    return {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = CounterController
