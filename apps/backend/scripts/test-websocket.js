#!/usr/bin/env node

/**
 * WebSocket test client
 */

const WebSocket = require('ws')

function testWebSocket() {
  console.log('🔌 Testing WebSocket connection...')
  
  const ws = new WebSocket('ws://localhost:3000')
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully')
    
    // Test ping
    console.log('📤 Sending ping...')
    ws.send(JSON.stringify({ type: 'ping' }))
    
    // Test get counters
    setTimeout(() => {
      console.log('📤 Requesting current counters...')
      ws.send(JSON.stringify({ type: 'get_counters' }))
    }, 1000)
    
    // Test subscribe to updates
    setTimeout(() => {
      console.log('📤 Subscribing to updates...')
      ws.send(JSON.stringify({ type: 'subscribe_updates' }))
    }, 2000)
    
    // Close connection after tests
    setTimeout(() => {
      console.log('👋 Closing connection...')
      ws.close()
    }, 5000)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📥 Received:', message.type, message.data ? 'with data' : '')
      
      if (message.type === 'counter_update') {
        console.log('  📊 Counters:', message.data)
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error.message)
    }
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message)
  })
  
  ws.on('close', () => {
    console.log('👋 WebSocket connection closed')
    console.log('🎉 WebSocket test completed')
  })
}

if (require.main === module) {
  testWebSocket()
}

module.exports = { testWebSocket }
