/**
 * Error handling middleware
 * Provides consistent error responses and logging
 */

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('❌ Error caught by middleware:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = new AppError(message, 400)
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error = new AppError('Duplicate entry', 400)
        break
      case '23503': // Foreign key violation
        error = new AppError('Referenced record not found', 400)
        break
      case '23502': // Not null violation
        error = new AppError('Required field missing', 400)
        break
      case 'ECONNREFUSED':
        error = new AppError('Database connection failed', 503)
        break
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Handle 404 routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404)
  next(error)
}

/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logLevel = res.statusCode >= 400 ? '❌' : '✅'
    
    console.log(`${logLevel} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}

/**
 * Rate limiting helper
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map()
  
  return (req, res, next) => {
    const clientId = req.ip
    const now = Date.now()
    
    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (now - value.resetTime > windowMs) {
        requests.delete(key)
      }
    }
    
    // Check current client
    const clientRequests = requests.get(clientId)
    
    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now })
      return next()
    }
    
    if (now - clientRequests.resetTime > windowMs) {
      requests.set(clientId, { count: 1, resetTime: now })
      return next()
    }
    
    if (clientRequests.count >= max) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((windowMs - (now - clientRequests.resetTime)) / 1000)
        }
      })
    }
    
    clientRequests.count++
    next()
  }
}

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  requestLogger,
  createRateLimit
}
