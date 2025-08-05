const express = require('express')
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

app.get('/', (req, res) => {
  res.send('Welcome to the Red vs Blue API! Use /api/red or /api/blue to activate colors.')
})

app.post('/api/red', (req, res) => {
  console.log(req.body)
  counter.red++
  res.send(`Red activated ${counter.red} times`)
})

app.post('/api/blue', (req, res) => {
  console.log(req.body)
  counter.blue++
  res.send(`Blue activated ${counter.blue} times`)
})
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
}).on('error', (err) => {
  console.error('Server error:', err)
})
