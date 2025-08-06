#!/usr/bin/env node

/**
 * Quick test script to validate the new architecture
 */

const CounterService = require('../services/CounterService')
const dbConfig = require('../config/database')

async function runTests() {
  console.log('🧪 Running architecture validation tests...')
  
  try {
    // Connect to database first
    console.log('🔌 Connecting to database...')
    await dbConfig.connect()
    
    const counterService = new CounterService()
    
    // Test 1: Health check
    console.log('\n1️⃣ Testing health check...')
    const health = await counterService.getHealthStatus()
    console.log('Health status:', health.status)
    
    // Test 2: Get current counters
    console.log('\n2️⃣ Testing get current counters...')
    const counters = await counterService.getCurrentCounters()
    console.log('Counters:', counters.success ? counters.data.counters : 'Failed')
    
    // Test 3: Increment red counter
    console.log('\n3️⃣ Testing increment red counter...')
    const redResult = await counterService.incrementCounter('red', {
      incrementBy: 1,
      clientInfo: { source: 'test_script' }
    })
    console.log('Red increment:', redResult.success ? 'Success' : redResult.error)
    
    // Test 4: Increment blue counter
    console.log('\n4️⃣ Testing increment blue counter...')
    const blueResult = await counterService.incrementCounter('blue', {
      incrementBy: 2,
      clientInfo: { source: 'test_script' }
    })
    console.log('Blue increment:', blueResult.success ? 'Success' : blueResult.error)
    
    // Test 5: Get updated counters
    console.log('\n5️⃣ Testing updated counters...')
    const updatedCounters = await counterService.getCurrentCounters()
    console.log('Updated counters:', updatedCounters.success ? updatedCounters.data.counters : 'Failed')
    
    // Test 6: Get statistics
    console.log('\n6️⃣ Testing statistics...')
    const stats = await counterService.getCounterStatistics()
    console.log('Statistics available:', stats.success ? 'Yes' : 'No')
    
    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    // Close database connection
    await dbConfig.close()
  }
}

// Run if called directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🎉 Test suite finished')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Test suite failed:', error.message)
    process.exit(1)
  })
}

module.exports = { runTests }
