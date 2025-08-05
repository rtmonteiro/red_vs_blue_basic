const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const INITIAL_CONCURRENT_REQUESTS = 1000;
const MAX_CONCURRENT_REQUESTS = 10000;
const STEP_SIZE = 1000;
const REQUESTS_PER_STEP = 10000;
const DELAY_BETWEEN_STEPS = 2000; // 2 seconds

// Global counters
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let currentStep = 0;

// Colors to test
const colors = ['red', 'blue'];

// Function to make a single HTTP request
function makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const startTime = Date.now();
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                if (res.statusCode === 200) {
                    successfulRequests++;
                    resolve({
                        success: true,
                        responseTime,
                        data: responseData,
                        statusCode: res.statusCode
                    });
                } else {
                    failedRequests++;
                    resolve({
                        success: false,
                        responseTime,
                        data: responseData,
                        statusCode: res.statusCode
                    });
                }
            });
        });

        req.on('error', (err) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            failedRequests++;
            resolve({
                success: false,
                responseTime,
                error: err.message,
                statusCode: null
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            failedRequests++;
            resolve({
                success: false,
                responseTime: 5000,
                error: 'Request timeout',
                statusCode: null
            });
        });

        req.write(postData);
        req.end();
    });
}

// Function to run concurrent requests
async function runConcurrentRequests(concurrency, requestCount) {
    console.log(`\n🚀 Starting step ${++currentStep}: ${concurrency} concurrent requests, ${requestCount} total requests`);
    
    const promises = [];
    const stepStartTime = Date.now();
    
    for (let i = 0; i < requestCount; i++) {
        const color = colors[i % colors.length];
        const endpoint = `/api/${color}`;
        const data = { color, requestId: i, timestamp: Date.now() };
        
        const promise = makeRequest(endpoint, data);
        promises.push(promise);
        totalRequests++;
        
        // Control concurrency
        if (promises.length >= concurrency) {
            await Promise.all(promises.splice(0, concurrency));
        }
        
        // Small delay to prevent overwhelming
        if (i % 50 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    
    // Wait for remaining requests
    if (promises.length > 0) {
        await Promise.all(promises);
    }
    
    const stepEndTime = Date.now();
    const stepDuration = stepEndTime - stepStartTime;
    
    console.log(`✅ Step ${currentStep} completed in ${stepDuration}ms`);
    console.log(`   Success: ${successfulRequests}/${totalRequests} (${((successfulRequests/totalRequests)*100).toFixed(2)}%)`);
    console.log(`   Failed: ${failedRequests}/${totalRequests} (${((failedRequests/totalRequests)*100).toFixed(2)}%)`);
    
    return {
        concurrency,
        requestCount,
        duration: stepDuration,
        successRate: (successfulRequests / totalRequests) * 100,
        failureRate: (failedRequests / totalRequests) * 100
    };
}

// Function to verify counter integrity
async function verifyCounters() {
    console.log('\n🔍 Verifying counter integrity...');
    
    try {
        // Get the current state by making a simple GET request
        const response = await makeRequest('/', {});
        
        if (response.success) {
            console.log('✅ Backend is still responding');
            
            // Make a few test requests to see current counters
            const redResponse = await makeRequest('/api/red', { color: 'red', test: true });
            const blueResponse = await makeRequest('/api/blue', { color: 'blue', test: true });
            
            if (redResponse.success && blueResponse.success) {
                console.log(`   Red counter response: ${redResponse.data}`);
                console.log(`   Blue counter response: ${blueResponse.data}`);
                
                // Extract numbers from responses
                const redMatch = redResponse.data.match(/(\d+)/);
                const blueMatch = blueResponse.data.match(/(\d+)/);
                
                if (redMatch && blueMatch) {
                    const redCount = parseInt(redMatch[1]);
                    const blueCount = parseInt(blueMatch[1]);
                    const totalExpected = Math.ceil(totalRequests / 2); // Roughly half red, half blue
                    
                    console.log(`   Expected roughly: ~${totalExpected} requests per color`);
                    console.log(`   Actual - Red: ${redCount}, Blue: ${blueCount}`);
                    console.log(`   Total counted: ${redCount + blueCount}, Total sent: ${totalRequests}`);
                    
                    const discrepancy = Math.abs((redCount + blueCount) - totalRequests);
                    if (discrepancy > totalRequests * 0.05) { // More than 5% discrepancy
                        console.log(`⚠️  WARNING: Significant discrepancy detected! Lost ${discrepancy} requests`);
                        return false;
                    } else {
                        console.log(`✅ Counter integrity looks good (discrepancy: ${discrepancy})`);
                        return true;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`❌ Error verifying counters: ${error.message}`);
        return false;
    }
    
    return true;
}

// Main stress test function
async function runStressTest() {
    console.log('🎯 RED vs BLUE Backend Stress Test');
    console.log('=====================================');
    console.log(`Target: ${BACKEND_URL}`);
    console.log(`Concurrency range: ${INITIAL_CONCURRENT_REQUESTS} - ${MAX_CONCURRENT_REQUESTS}`);
    console.log(`Requests per step: ${REQUESTS_PER_STEP}`);
    console.log(`Step size: ${STEP_SIZE}`);
    
    // Reset counters
    totalRequests = 0;
    successfulRequests = 0;
    failedRequests = 0;
    currentStep = 0;
    
    const startTime = Date.now();
    let breakingPoint = null;
    
    try {
        // Initial verification
        const initialVerification = await verifyCounters();
        if (!initialVerification) {
            console.log('❌ Initial verification failed. Is the backend running?');
            return;
        }
        
        // Run stress test steps
        for (let concurrency = INITIAL_CONCURRENT_REQUESTS; concurrency <= MAX_CONCURRENT_REQUESTS; concurrency += STEP_SIZE) {
            const stepResult = await runConcurrentRequests(concurrency, REQUESTS_PER_STEP);
            
            // Check if we're starting to see failures
            if (stepResult.failureRate > 5) { // More than 5% failure rate
                console.log(`⚠️  High failure rate detected at ${concurrency} concurrent requests`);
                breakingPoint = concurrency;
            }
            
            // Verify counter integrity after each step
            const integrityCheck = await verifyCounters();
            if (!integrityCheck) {
                console.log(`💥 Counter integrity compromised at ${concurrency} concurrent requests!`);
                breakingPoint = concurrency;
                break;
            }
            
            // Break if failure rate is too high
            if (stepResult.failureRate > 20) {
                console.log(`💥 Breaking point reached at ${concurrency} concurrent requests!`);
                breakingPoint = concurrency;
                break;
            }
            
            // Wait between steps
            if (concurrency < MAX_CONCURRENT_REQUESTS) {
                console.log(`⏳ Waiting ${DELAY_BETWEEN_STEPS}ms before next step...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_STEPS));
            }
        }
        
    } catch (error) {
        console.log(`💥 Stress test crashed: ${error.message}`);
    }
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Final report
    console.log('\n📊 STRESS TEST RESULTS');
    console.log('=======================');
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Total requests sent: ${totalRequests}`);
    console.log(`Successful requests: ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(2)}%)`);
    console.log(`Failed requests: ${failedRequests} (${((failedRequests/totalRequests)*100).toFixed(2)}%)`);
    console.log(`Average requests/second: ${(totalRequests / (totalDuration / 1000)).toFixed(2)}`);
    
    if (breakingPoint) {
        console.log(`💥 Breaking point: ${breakingPoint} concurrent requests`);
    } else {
        console.log(`✅ Backend survived all ${MAX_CONCURRENT_REQUESTS} concurrent requests!`);
    }
    
    // Final verification
    console.log('\n🔍 Final counter verification...');
    await verifyCounters();
}

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Stress test interrupted by user');
    console.log(`📊 Results so far:`);
    console.log(`   Total requests: ${totalRequests}`);
    console.log(`   Successful: ${successfulRequests}`);
    console.log(`   Failed: ${failedRequests}`);
    process.exit(0);
});

// Run the stress test
if (require.main === module) {
    console.log('🏁 Starting stress test in 3 seconds...');
    setTimeout(runStressTest, 3000);
}

module.exports = { runStressTest, makeRequest, verifyCounters };
