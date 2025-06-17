import express from 'express';
import {
  adminLogin,
  getDashboardMetrics,
  getAllUsers,
  toggleUserBlock,
  deleteUser,
  getAllPropertiesAdmin,
  updatePropertyStatus,
  getAllBookingsAdmin,
  overrideBookingStatus,
  sendGlobalNotification,
  getSystemAnalytics
} from '../controllers/admin.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Admin authentication
router.post('/login', adminLogin);

// Protected admin routes
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// Dashboard
router.get('/dashboard', getDashboardMetrics);
router.get('/analytics', getSystemAnalytics);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/block', toggleUserBlock);
router.delete('/users/:id', deleteUser);

// Property management
router.get('/properties', getAllPropertiesAdmin);
router.patch('/properties/:id/status', updatePropertyStatus);

// Booking management
router.get('/bookings', getAllBookingsAdmin);
router.patch('/bookings/:id/status', overrideBookingStatus);

// Notifications
router.post('/notifications/global', sendGlobalNotification);

export default router;