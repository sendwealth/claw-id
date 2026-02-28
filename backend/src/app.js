/**
 * CLAW ID Backend Application
 * Main Express application setup
 */

require('dotenv').config();
const express = require('express');
const agentsRouter = require('./routes/agents');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'CLAW ID Backend',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1/agents', agentsRouter);
app.use('/api/agents', agentsRouter); // 兼容旧路径

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CLAW ID Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      agents: {
        create: 'POST /api/agents',
        list: 'GET /api/agents',
        get: 'GET /api/agents/:id',
        delete: 'DELETE /api/agents/:id'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 CLAW ID Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API docs: http://localhost:${PORT}/`);
  });
}

module.exports = app;
