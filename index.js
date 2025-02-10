require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;
const startTime = new Date();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors());
app.use(express.json());
app.use(limiter); // Apply rate limiting

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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
    environment: process.env.NODE_ENV || 'development',
    rateLimit: {
      windowMs: limiter.windowMs,
      max: limiter.max
    }
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    timestamp: new Date().toISOString()
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 