// DOM elements
const redButton = document.getElementById('red-btn');
const blueButton = document.getElementById('blue-btn');
const resultDiv = document.getElementById('result');
const redCountElement = document.getElementById('red-count');
const blueCountElement = document.getElementById('blue-count');
const statusElement = document.getElementById('status');
const environmentSelect = document.getElementById('environment');
const apiUrlInput = document.getElementById('api-url');
const wsUrlInput = document.getElementById('ws-url');
const connectButton = document.getElementById('connect-btn');

// Configuration
let currentApiUrl = 'http://localhost:3000/api';
let currentWsUrl = 'ws://localhost:3000';
let ws = null;

// Environment configurations
const environments = {
    local: {
        api: 'http://localhost:3000/api',
        ws: 'ws://localhost:3000'
    },
    remote: {
        api: 'https://red-vs-blue-basic.onrender.com/api',
        ws: 'wss://red-vs-blue-basic.onrender.com'
    }
};

// Initialize
function init() {
    updateEnvironment();
    connectWebSocket();
    
    // Event listeners
    environmentSelect.addEventListener('change', updateEnvironment);
    connectButton.addEventListener('click', connectWebSocket);
    redButton.addEventListener('click', () => makeRequest('red'));
    blueButton.addEventListener('click', () => makeRequest('blue'));
    
    // Update URLs when manually changed
    apiUrlInput.addEventListener('change', () => {
        currentApiUrl = apiUrlInput.value;
    });
    
    wsUrlInput.addEventListener('change', () => {
        currentWsUrl = wsUrlInput.value;
    });
}

// Update environment settings
function updateEnvironment() {
    const env = environmentSelect.value;
    const config = environments[env];
    
    currentApiUrl = config.api;
    currentWsUrl = config.ws;
    
    apiUrlInput.value = currentApiUrl;
    wsUrlInput.value = currentWsUrl;
    
    // Reconnect WebSocket with new URL
    if (ws) {
        ws.close();
    }
    connectWebSocket();
}

// WebSocket connection
function connectWebSocket() {
    updateStatus('Connecting...', 'disconnected');
    
    try {
        ws = new WebSocket(currentWsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            updateStatus('Connected - Real-time updates active', 'connected');
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'counter_update') {
                    updateCounterDisplay(message.data);
                    if (message.timestamp) {
                        console.log('Counter updated at:', message.timestamp);
                    }
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            updateStatus('Disconnected - Click "Connect WebSocket" to reconnect', 'disconnected');
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateStatus('Connection error - Check console for details', 'disconnected');
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateStatus('Failed to connect - Check WebSocket URL', 'disconnected');
    }
}

// Update counter display
function updateCounterDisplay(counters) {
    redCountElement.textContent = counters.red || 0;
    blueCountElement.textContent = counters.blue || 0;
}

// Update status display
function updateStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
}

// Make API request
async function makeRequest(color) {
    try {
        console.log(`Making ${color} request to ${currentApiUrl}/${color}`);
        
        const response = await fetch(`${currentApiUrl}/${color}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: color, timestamp: new Date().toISOString() })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('Response:', data);
        
        // Show response briefly
        resultDiv.innerHTML = `<p style="color: ${color}; font-weight: bold;">${data}</p>`;
        setTimeout(() => {
            resultDiv.innerHTML = '';
        }, 2000);
        
        return data;
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        
        // If WebSocket is not connected, try to get current state via API
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not connected, trying to get current state...');
            // You could add a GET endpoint to fetch current counters
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
