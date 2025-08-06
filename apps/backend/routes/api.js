const express = require('express')
const CounterController = require('../controllers/CounterController')
const { createRateLimit } = require('../middleware/errorHandler')

const router = express.Router()
const counterController = new CounterController()

// Rate limiting for different endpoints
const generalRateLimit = createRateLimit(1000, 1000) // 1000 requests per second
const incrementRateLimit = createRateLimit(1000, 1000) // 1000 increments per second
const adminRateLimit = createRateLimit(60 * 60 * 1000, 5) // 5 admin actions per hour

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 * @example
 * curl -X GET http://localhost:3000/api/health
 * @returns {Object} Health status
 */
router.get('/health', counterController.healthCheck)

/**
 * @route   GET /api/status
 * @desc    Get API status and counter information
 * @access  Public
 * @example
 * curl -X GET http://localhost:3000/api/status
 * @returns {Object} API status and counters
 */
router.get('/status', generalRateLimit, counterController.getStatus)

/**
 * @route   GET /api/counters
 * @desc    Get current counter values
 * @access  Public
 * @example
 * curl -X GET http://localhost:3000/api/counters
 * @returns {Object} Current counters
 */
router.get('/counters', generalRateLimit, counterController.getCounters)

/**
 * @route   POST /api/red
 * @desc    Increment red counter
 * @access  Public
 */
router.post('/red', incrementRateLimit, counterController.incrementRed)

/**
 * @route   POST /api/blue
 * @desc    Increment blue counter
 * @access  Public
 */
router.post('/blue', incrementRateLimit, counterController.incrementBlue)

/**
 * @route   POST /api/counters/batch
 * @desc    Batch increment multiple counters
 * @access  Public
 */
router.post('/counters/batch', incrementRateLimit, counterController.batchIncrement)

/**
 * @route   GET /api/counters/stats
 * @desc    Get counter statistics
 * @access  Public
 */
router.get('/counters/stats', generalRateLimit, counterController.getStatistics)

/**
 * @route   GET /api/counters/history
 * @desc    Get counter history with filtering
 * @access  Public
 */
router.get('/counters/history', generalRateLimit, counterController.getHistory)

/**
 * @route   POST /api/counters/reset
 * @desc    Reset all counters (admin only)
 * @access  Admin
 */
router.post('/counters/reset', adminRateLimit, counterController.resetCounters)

module.exports = router
