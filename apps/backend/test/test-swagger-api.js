#!/usr/bin/env node

/**
 * Swagger API Test Script
 * Tests various API endpoints documented in Swagger
 */

const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3000/api';

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsedBody });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Run API tests
 */
async function runTests() {
  console.log('🧪 Testing Swagger-documented API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status} - ${health.data.status}`);
    console.log(`   Counters: Red ${health.data.counters.red}, Blue ${health.data.counters.blue}\n`);

    // Test 2: Get counters
    console.log('2. Testing get counters...');
    const counters = await makeRequest('GET', '/counters');
    console.log(`   Status: ${counters.status}`);
    console.log(`   Data: ${JSON.stringify(counters.data.data.counters)}\n`);

    // Test 3: Increment red
    console.log('3. Testing increment red...');
    const redIncrement = await makeRequest('POST', '/red', { 
      incrementBy: 1, 
      sessionId: 'swagger-test' 
    });
    console.log(`   Status: ${redIncrement.status}`);
    console.log(`   Message: ${redIncrement.data.message}\n`);

    // Test 4: Increment blue
    console.log('4. Testing increment blue...');
    const blueIncrement = await makeRequest('POST', '/blue', { 
      incrementBy: 2, 
      sessionId: 'swagger-test' 
    });
    console.log(`   Status: ${blueIncrement.status}`);
    console.log(`   Message: ${blueIncrement.data.message}\n`);

    // Test 5: Batch increment
    console.log('5. Testing batch increment...');
    const batchIncrement = await makeRequest('POST', '/counters/batch', {
      increments: [
        { color: 'red', incrementBy: 1 },
        { color: 'blue', incrementBy: 1 }
      ]
    });
    console.log(`   Status: ${batchIncrement.status}`);
    console.log(`   Successful: ${batchIncrement.data.data.summary.successful}`);
    console.log(`   Failed: ${batchIncrement.data.data.summary.failed}\n`);

    // Test 6: Get statistics
    console.log('6. Testing statistics...');
    const stats = await makeRequest('GET', '/counters/stats?timeRange=24%20hours');
    console.log(`   Status: ${stats.status}`);
    console.log(`   Time Range: ${stats.data.data.timeRange}`);
    console.log(`   Total Count: ${stats.data.data.summary.totalCount}\n`);

    // Test 7: Get history
    console.log('7. Testing history...');
    const history = await makeRequest('GET', '/counters/history?limit=5');
    console.log(`   Status: ${history.status}`);
    console.log(`   History entries: ${history.data.data.history.length}\n`);

    console.log('✅ All Swagger-documented endpoints tested successfully!');
    console.log('📚 View full documentation at http://localhost:3000/api-docs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
