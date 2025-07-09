import express from 'express';
import { 
  sendLoginOtp, 
  verifyLoginOtp, 
  sendSignupOtp, 
  verifySignupOtp, 
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  refreshToken,
  resendOtp
} from '../controllers/auth.js';
import { validateEmailOtp, validateSignupData } from '../middleware/validation.js';

const router = express.Router();

// Login routes
router.post('/login/send-otp', validateEmailOtp, sendLoginOtp);
router.post('/login/verify-otp', validateEmailOtp, verifyLoginOtp);

// Signup routes
router.post('/signup/send-otp', validateEmailOtp, sendSignupOtp);
router.post('/signup/verify-otp', validateSignupData, verifySignupOtp);

// Forgot password routes
router.post('/forgot-password/send-otp', validateEmailOtp, sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', validateEmailOtp, verifyForgotPasswordOtp);

// Common routes
router.post('/refresh-token', refreshToken);
router.post('/resend-otp', validateEmailOtp, resendOtp);

export default router;