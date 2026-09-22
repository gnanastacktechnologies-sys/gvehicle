import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// 24/7 Health Check & Keep-Alive Endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    app: 'Gvehicle Fleet Management API (24/7 Keep-Alive Active)',
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

// Serve Frontend Production Assets (Single Port 17203 Mode)
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

// Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
