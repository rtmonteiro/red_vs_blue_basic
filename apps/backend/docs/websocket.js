/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketMessage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: 
 *             - connection_confirmed
 *             - counter_update
 *             - statistics_update
 *             - error
 *             - subscribe_updates
 *             - get_counters
 *             - get_stats
 *         data:
 *           type: object
 *           description: Message payload (varies by type)
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 *     WebSocketCounterUpdate:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: counter_update
 *         data:
 *           type: object
 *           properties:
 *             red:
 *               type: integer
 *               example: 55
 *             blue:
 *               type: integer
 *               example: 42
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-08-06T01:37:31.015Z"
 * 
 *     WebSocketConnectionConfirmed:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: connection_confirmed
 *         data:
 *           type: object
 *           properties:
 *             clientId:
 *               type: string
 *               example: "client_1754444250993_oo3ssqwnt"
 *             connectedAt:
 *               type: string
 *               format: date-time
 *               example: "2025-08-06T01:37:30.993Z"
 * 
 * /websocket:
 *   get:
 *     summary: WebSocket Connection
 *     description: |
 *       Connect to the WebSocket server for real-time updates.
 *       
 *       **Connection URL:** `ws://localhost:3000` (development) or `wss://your-domain.com` (production)
 *       
 *       ## Supported Message Types
 *       
 *       ### Client to Server:
 *       - `get_counters` - Request current counter values
 *       - `subscribe_updates` - Subscribe to real-time counter updates
 *       - `get_stats` - Request statistics with optional timeRange
 *       
 *       ### Server to Client:
 *       - `connection_confirmed` - Sent when client connects successfully
 *       - `counter_update` - Sent when counters are updated (real-time)
 *       - `statistics_update` - Sent with statistics data
 *       - `error` - Sent when an error occurs
 *       
 *       ## Example Usage
 *       
 *       ```javascript
 *       const ws = new WebSocket('ws://localhost:3000');
 *       
 *       ws.on('open', () => {
 *         console.log('Connected to WebSocket');
 *         // Subscribe to updates
 *         ws.send(JSON.stringify({ type: 'subscribe_updates' }));
 *       });
 *       
 *       ws.on('message', (data) => {
 *         const message = JSON.parse(data);
 *         if (message.type === 'counter_update') {
 *           console.log('Counter Update:', message.data);
 *         }
 *       });
 *       ```
 *       
 *       ## Rate Limiting
 *       - Connection limit: 100 concurrent connections per IP
 *       - Message rate: 10 messages per second per connection
 *       
 *     tags: [WebSocket]
 *     parameters:
 *       - in: header
 *         name: Upgrade
 *         required: true
 *         schema:
 *           type: string
 *           example: websocket
 *       - in: header
 *         name: Connection
 *         required: true
 *         schema:
 *           type: string
 *           example: Upgrade
 *     responses:
 *       101:
 *         description: Switching Protocols - WebSocket connection established
 *       400:
 *         description: Bad Request - Invalid WebSocket handshake
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *       500:
 *         description: Internal Server Error
 */
