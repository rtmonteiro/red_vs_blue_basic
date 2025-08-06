#!/usr/bin/env node

// Enhanced WebSocket client test with connection monitoring
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection to ws://localhost:3000...');

const ws = new WebSocket('ws://localhost:3000');
let isConnected = false;

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    isConnected = true;
    
    // Subscribe to updates
    console.log('📡 Subscribing to counter updates...');
    ws.send(JSON.stringify({ type: 'subscribe_updates' }));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received message:', JSON.stringify(message, null, 2));
        
        if (message.type === 'counter_update') {
            console.log(`🎯 Counter Update - Red: ${message.data.red}, Blue: ${message.data.blue}`);
            if (message.timestamp) {
                console.log(`   Timestamp: ${message.timestamp}`);
            }
        } else if (message.type === 'connection_confirmed') {
            console.log(`✅ Connection confirmed - Client ID: ${message.data.clientId}`);
        }
    } catch (error) {
        console.log('📨 Raw message:', data.toString());
    }
});

ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
    isConnected = false;
});

ws.on('error', (error) => {
    console.error('💥 WebSocket error:', error.message);
});

// Keep the script running and show status
console.log('👀 Listening for real-time updates... Press Ctrl+C to exit');

// Show connection status every 10 seconds
const statusInterval = setInterval(() => {
    console.log(`📊 Status: ${isConnected ? 'Connected' : 'Disconnected'} | State: ${ws.readyState}`);
}, 10000);

process.on('SIGINT', () => {
    console.log('\n👋 Closing WebSocket connection...');
    clearInterval(statusInterval);
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    process.exit(0);
});
