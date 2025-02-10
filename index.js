require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;
const startTime = new Date();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to LevantFlow API',
    status: 'online',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      startTime: startTime.toISOString(),
      memory: process.memoryUsage(),
      node: process.version,
      platform: process.platform,
      hostname: os.hostname()
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const usedMemory = process.memoryUsage();
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: {
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length
    },
    process: {
      memory: {
        used: Math.round(usedMemory.heapUsed / 1024 / 1024 * 100) / 100 + 'MB',
        total: Math.round(usedMemory.heapTotal / 1024 / 1024 * 100) / 100 + 'MB'
      },
      pid: process.pid,
      version: process.version
    }
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server time: ${new Date().toISOString()}`);
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
}); 