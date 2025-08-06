#!/usr/bin/env node

// Simple WebSocket client test
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        if (message.type === 'counter_update') {
            console.log(`📊 Counter Update - Red: ${message.data.red}, Blue: ${message.data.blue}`);
            if (message.timestamp) {
                console.log(`   Timestamp: ${message.timestamp}`);
            }
        }
    } catch (error) {
        console.log('📨 Raw message:', data.toString());
    }
});

ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
});

ws.on('error', (error) => {
    console.error('💥 WebSocket error:', error.message);
});

// Keep the script running
console.log('👀 Listening for real-time updates... Press Ctrl+C to exit');
process.on('SIGINT', () => {
    console.log('\n👋 Closing WebSocket connection...');
    ws.close();
    process.exit(0);
});
