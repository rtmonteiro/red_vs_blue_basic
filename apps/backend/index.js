const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const port = process.env.PORT || 3000

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json())

const counter = { red: 0, blue: 0 }

// Create HTTP server
const server = http.createServer(app)

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// Store connected clients
const clients = new Set()

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected')
  clients.add(ws)
  
  // Send current counter values to new client
  ws.send(JSON.stringify({
    type: 'counter_update',
    data: counter
  }))
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    clients.delete(ws)
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })
})

// Function to broadcast counter updates to all connected clients
function broadcastCounterUpdate() {
  const message = JSON.stringify({
    type: 'counter_update',
    data: counter,
    timestamp: new Date().toISOString()
  })
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

app.get('/', (req, res) => {
  res.send('Welcome to the Red vs Blue API! Use /api/red or /api/blue to activate colors.')
})

app.get('/api/status', (req, res) => {
  res.json({
    counters: counter,
    connectedClients: clients.size,
    timestamp: new Date().toISOString()
  })
})

app.post('/api/red', (req, res) => {
  console.log(req.body)
  counter.red++
  broadcastCounterUpdate()
  res.send(`Red activated ${counter.red} times`)
})

app.post('/api/blue', (req, res) => {
  console.log(req.body)
  counter.blue++
  broadcastCounterUpdate()
  res.send(`Blue activated ${counter.blue} times`)
})
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
  console.log(`WebSocket server running at ws://localhost:${port}`)
}).on('error', (err) => {
  console.error('Server error:', err)
})
