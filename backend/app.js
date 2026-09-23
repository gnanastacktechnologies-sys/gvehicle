import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import fuelRoutes from './routes/fuelRoutes.js';
import oilRoutes from './routes/oilRoutes.js';
import tyreRoutes from './routes/tyreRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Body Parser & CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback permissive CORS
    },
    credentials: true,
  })
);

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  // Skip DB connection check for health check endpoints if needed
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database Connection Middleware Error:', err.message);
    res.status(500).json({ success: false, message: 'Database connection error: ' + err.message });
  }
});

// 24/7 Health Check & Serverless Health Endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Standalone Node.js',
    app: 'Gvehicle Fleet Management API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/oil-changes', oilRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingRoutes);

// Serve Frontend Production Assets (Only in standalone Node mode, not on Vercel)
if (!process.env.VERCEL) {
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });
}

// Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
