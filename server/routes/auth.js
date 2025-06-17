import express from 'express';
import { 
  sendLoginOtp, 
  verifyLoginOtp, 
  sendSignupOtp, 
  verifySignupOtp, 
  refreshToken,
  resendOtp
} from '../controllers/auth.js';
import { validatePhoneOtp, validateSignupData } from '../middleware/validation.js';

const router = express.Router();

// Login routes
router.post('/login/send-otp', validatePhoneOtp, sendLoginOtp);
router.post('/login/verify-otp', validatePhoneOtp, verifyLoginOtp);

// Signup routes
router.post('/signup/send-otp', validatePhoneOtp, sendSignupOtp);
router.post('/signup/verify-otp', validateSignupData, verifySignupOtp);

// Common routes
router.post('/refresh-token', refreshToken);
router.post('/resend-otp', validatePhoneOtp, resendOtp);

export default router;