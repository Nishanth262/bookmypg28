import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  extendBooking
} from '../controllers/bookings.js';
import { validateBooking } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateBooking, createBooking);
router.get('/user', getUserBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/extend', extendBooking);

export default router;