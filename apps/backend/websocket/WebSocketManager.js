const WebSocket = require('ws')
const CounterService = require('../services/CounterService')

/**
 * WebSocket Manager
 * Handles real-time communication with clients
 */
class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ server })
    this.clients = new Map()
    this.counterService = new CounterService()
    
    this.setupWebSocketServer()
  }

  /**
   * Setup WebSocket server and event handlers
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket Server error:', error)
    })

    // Cleanup disconnected clients periodically
    setInterval(() => {
      this.cleanupDisconnectedClients()
    }, 30000) // Every 30 seconds
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws, req) {
    const clientId = this.generateClientId()
    const clientInfo = {
      id: clientId,
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    }

    // Store client
    this.clients.set(clientId, {
      ws,
      info: clientInfo,
      isAlive: true
    })

    console.log(`✅ New WebSocket client connected: ${clientId}`)
    console.log(`📊 Total connected clients: ${this.clients.size}`)

    // Send initial data to new client
    await this.sendInitialData(ws)

    // Setup client event handlers
    this.setupClientHandlers(ws, clientId)

    // Send connection confirmation
    this.sendMessage(ws, {
      type: 'connection_confirmed',
      data: {
        clientId,
        connectedAt: clientInfo.connectedAt
      }
    })
  }

  /**
   * Setup event handlers for a specific client
   */
  setupClientHandlers(ws, clientId) {
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        await this.handleClientMessage(ws, clientId, message)
      } catch (error) {
        console.error(`❌ Error parsing message from client ${clientId}:`, error.message)
        this.sendError(ws, 'Invalid message format')
      }
    })

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnection(clientId)
    })

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error.message)
      this.handleDisconnection(clientId)
    })

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      const client = this.clients.get(clientId)
      if (client) {
        client.isAlive = true
        client.info.lastSeen = new Date().toISOString()
      }
    })
  }

  /**
   * Handle messages from clients
   */
  async handleClientMessage(ws, clientId, message) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.info.lastSeen = new Date().toISOString()

    switch (message.type) {
      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() })
        break

      case 'get_counters':
        await this.sendCounterUpdate(ws)
        break

      case 'get_stats':
        await this.sendStatistics(ws, message.timeRange)
        break

      case 'subscribe_updates':
        client.subscribed = true
        this.sendMessage(ws, { 
          type: 'subscription_confirmed', 
          data: { subscribed: true } 
        })
        break

      case 'unsubscribe_updates':
        client.subscribed = false
        this.sendMessage(ws, { 
          type: 'subscription_confirmed', 
          data: { subscribed: false } 
        })
        break

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`)
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId)
    if (client) {
      console.log(`👋 Client disconnected: ${clientId}`)
      this.clients.delete(clientId)
      console.log(`📊 Remaining connected clients: ${this.clients.size}`)
    }
  }

  /**
   * Send initial data to newly connected client
   */
  async sendInitialData(ws) {
    try {
      // Send current counter values
      await this.sendCounterUpdate(ws)
      
      // Send basic statistics
      await this.sendStatistics(ws, '24 hours')
      
    } catch (error) {
      console.error('❌ Error sending initial data:', error.message)
      this.sendError(ws, 'Failed to load initial data')
    }
  }

  /**
   * Send counter update to specific client or all clients
   */
  async sendCounterUpdate(ws = null) {
    try {
      const result = await this.counterService.getCurrentCounters()
      
      if (!result.success) {
        console.error('❌ Failed to get counter data for WebSocket update')
        return
      }

      const message = {
        type: 'counter_update',
        data: result.data.counters,
        timestamp: result.timestamp
      }

      if (ws) {
        // Send to specific client
        this.sendMessage(ws, message)
      } else {
        // Broadcast to all subscribed clients
        this.broadcastToSubscribed(message)
      }

    } catch (error) {
      console.error('❌ Error sending counter update:', error.message)
    }
  }

  /**
   * Send statistics to client
   */
  async sendStatistics(ws, timeRange = '24 hours') {
    try {
      const result = await this.counterService.getCounterStatistics(timeRange)
      
      if (result.success) {
        this.sendMessage(ws, {
          type: 'statistics_update',
          data: result.data,
          timeRange
        })
      } else {
        this.sendError(ws, 'Failed to fetch statistics')
      }

    } catch (error) {
      console.error('❌ Error sending statistics:', error.message)
      this.sendError(ws, 'Error fetching statistics')
    }
  }

  /**
   * Broadcast counter update to all connected clients
   */
  async broadcastCounterUpdate() {
    await this.sendCounterUpdate()
  }

  /**
   * Broadcast message to all subscribed clients
   */
  broadcastToSubscribed(message) {
    const subscribedClients = Array.from(this.clients.values())
      .filter(client => client.subscribed !== false)

    subscribedClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message)
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 Broadcasted to ${subscribedClients.length} clients:`, message.type)
    }
  }

  /**
   * Send message to specific WebSocket client
   */
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error.message)
      }
    }
  }

  /**
   * Send error message to client
   */
  sendError(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.clients.size
  }

  /**
   * Get clients information
   */
  getClientsInfo() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.info.id,
      connectedAt: client.info.connectedAt,
      lastSeen: client.info.lastSeen,
      subscribed: client.subscribed !== false
    }))
  }

  /**
   * Cleanup disconnected clients
   */
  cleanupDisconnectedClients() {
    const disconnectedClients = []
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState !== WebSocket.OPEN) {
        disconnectedClients.push(clientId)
      } else {
        // Send ping to check if client is still alive
        client.isAlive = false
        client.ws.ping()
        
        // If client didn't respond to previous ping, consider it dead
        setTimeout(() => {
          if (!client.isAlive) {
            disconnectedClients.push(clientId)
            client.ws.terminate()
          }
        }, 1000)
      }
    })

    // Remove disconnected clients
    disconnectedClients.forEach(clientId => {
      this.clients.delete(clientId)
    })

    if (disconnectedClients.length > 0) {
      console.log(`🧹 Cleaned up ${disconnectedClients.length} disconnected clients`)
    }
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down WebSocket server...')
    
    // Notify all clients about shutdown
    this.clients.forEach(client => {
      this.sendMessage(client.ws, {
        type: 'server_shutdown',
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
      })
    })

    // Close all connections
    this.wss.clients.forEach(ws => {
      ws.close(1001, 'Server shutdown')
    })

    // Close server
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('✅ WebSocket server shut down successfully')
        resolve()
      })
    })
  }
}

module.exports = WebSocketManager
