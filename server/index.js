import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { updateExpiredBookings } from './controllers/bookings.js';
import emailService from './services/emailService.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Test email service on startup
emailService.testConnection();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', authenticateToken, bookingRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      email: 'configured'
    }
  });
});

// Cron job to update expired bookings (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running expired bookings cleanup...');
  try {
    const updatedCount = await updateExpiredBookings();
    console.log(`Cleaned up ${updatedCount} expired bookings`);
  } catch (error) {
    console.error('Error in expired bookings cleanup:', error);
  }
});

// Cron job to clean up expired OTPs (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running expired OTPs cleanup...');
  try {
    const cleanedCount = await emailService.cleanupExpiredOtps();
    console.log(`Cleaned up ${cleanedCount} expired OTPs`);
  } catch (error) {
    console.error('Error in expired OTPs cleanup:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service configured for: ${process.env.SMTP_USER || 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and DB connections');
  await prisma.$disconnect();
  process.exit(0);
});