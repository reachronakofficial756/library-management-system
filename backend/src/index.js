require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ─── Import Routes ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const memberRoutes = require('./routes/members');
const borrowRoutes = require('./routes/borrow');

// ─── Connect to Database ──────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// Rate limiting: max 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShelfLife API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/borrow', borrowRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 ShelfLife API running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
