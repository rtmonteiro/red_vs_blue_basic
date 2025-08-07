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
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: "healthy"
 *               database:
 *                 status: "healthy"
 *               counters:
 *                 red: 42
 *                 blue: 38
 *               lastUpdated: 1754444250993
 *               timestamp: "2025-08-06T01:37:30.993Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/health', counterController.healthCheck)

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get API status and system information
 *     description: Returns detailed status information including connected clients and system metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Status information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 status: "operational"
 *                 environment: "development"
 *                 connectedClients: 5
 *                 uptime: "2h 15m 30s"
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/status', generalRateLimit, counterController.getStatus)

/**
 * @swagger
 * /api/counters:
 *   get:
 *     summary: Get current counter values
 *     description: Returns the current values for red and blue counters
 *     tags: [Counters]
 *     responses:
 *       200:
 *         description: Counter values retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         counters:
 *                           type: object
 *                           properties:
 *                             red:
 *                               type: integer
 *                               example: 42
 *                             blue:
 *                               type: integer
 *                               example: 38
 *                         lastUpdated:
 *                           type: integer
 *                           example: 1754444250993
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/counters', generalRateLimit, counterController.getCounters)

/**
 * @swagger
 * /api/red:
 *   post:
 *     summary: Increment red counter
 *     description: Increments the red counter by the specified amount (default 1)
 *     tags: [Counters]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncrementRequest'
 *           example:
 *             incrementBy: 1
 *             sessionId: "user123"
 *     responses:
 *       200:
 *         description: Red counter incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Red activated 43 times"
 *                     data:
 *                       $ref: '#/components/schemas/CounterUpdate'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/red', incrementRateLimit, counterController.incrementRed)

/**
 * @swagger
 * /api/blue:
 *   post:
 *     summary: Increment blue counter
 *     description: Increments the blue counter by the specified amount (default 1)
 *     tags: [Counters]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncrementRequest'
 *           example:
 *             incrementBy: 2
 *             sessionId: "user456"
 *     responses:
 *       200:
 *         description: Blue counter incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Blue activated 40 times"
 *                     data:
 *                       $ref: '#/components/schemas/CounterUpdate'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/blue', incrementRateLimit, counterController.incrementBlue)

/**
 * @swagger
 * /api/counters/batch:
 *   post:
 *     summary: Batch increment multiple counters
 *     description: Increment multiple counters in a single request
 *     tags: [Counters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchIncrementRequest'
 *           example:
 *             increments:
 *               - color: "red"
 *                 incrementBy: 2
 *               - color: "blue"
 *                 incrementBy: 1
 *     responses:
 *       200:
 *         description: All increments processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       207:
 *         description: Some increments failed (partial success)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/counters/batch', incrementRateLimit, counterController.batchIncrement)

/**
 * @swagger
 * /api/counters/stats:
 *   get:
 *     summary: Get counter statistics
 *     description: Returns detailed statistics and analytics for counters within a specified time range
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: ["1 hour", "24 hours", "7 days", "30 days"]
 *           default: "24 hours"
 *         description: Time range for statistics
 *         example: "24 hours"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Statistics'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/counters/stats', generalRateLimit, counterController.getStatistics)

/**
 * @swagger
 * /api/counters/history:
 *   get:
 *     summary: Get counter history
 *     description: Returns paginated counter history with optional filtering
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *           enum: ["red", "blue"]
 *         description: Filter by counter color
 *         example: "red"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Maximum number of records to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *         example: 0
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601)
 *         example: "2025-08-06T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601)
 *         example: "2025-08-06T23:59:59Z"
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/counters/history', generalRateLimit, counterController.getHistory)

/**
 * @swagger
 * /api/counters/reset:
 *   post:
 *     summary: Reset all counters (Admin only)
 *     description: Resets both red and blue counters to zero. This is an administrative action with strict rate limiting.
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Counters reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/counters/reset', adminRateLimit, counterController.resetCounters)

module.exports = router
