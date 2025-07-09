import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService.js';

const prisma = new PrismaClient();

// Send OTP for login
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format. Please enter a valid email address.' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found. Please sign up first.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Generate and send OTP
    const otpRecord = await emailService.createOtp(normalizedEmail, 'LOGIN', user.id);
    await emailService.sendOtp(normalizedEmail, otpRecord.code, 'LOGIN', user.name);

    res.json({
      message: 'OTP sent successfully to your email',
      email: normalizedEmail,
      expiresAt: otpRecord.expiresAt
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Verify OTP and login
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email address and OTP are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    await emailService.verifyOtp(normalizedEmail, otp, 'LOGIN');

    // Get user
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isVerified: true,
        isBlocked: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Mark user as verified if not already
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
      user.isVerified = true;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP. Please try again.',
        code: 'INVALID_OTP'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send OTP for signup
export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format. Please enter a valid email address.' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email address. Please login instead.',
        code: 'USER_EXISTS'
      });
    }

    // Generate and send OTP
    const otpRecord = await emailService.createOtp(normalizedEmail, 'SIGNUP');
    await emailService.sendOtp(normalizedEmail, otpRecord.code, 'SIGNUP');

    res.json({
      message: 'OTP sent successfully to your email',
      email: normalizedEmail,
      expiresAt: otpRecord.expiresAt
    });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Verify OTP and complete signup
export const verifySignupOtp = async (req, res) => {
  try {
    const { name, email, phone, otp, role = 'USER' } = req.body;

    if (!name || !email || !otp) {
      return res.status(400).json({ message: 'Name, email address and OTP are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    await emailService.verifyOtp(normalizedEmail, otp, 'SIGNUP');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email address',
        code: 'USER_EXISTS'
      });
    }

    // Check phone uniqueness if provided
    if (phone && phone.trim()) {
      const existingPhoneUser = await prisma.user.findUnique({ 
        where: { phone: phone.trim() } 
      });
      if (existingPhoneUser) {
        return res.status(400).json({ 
          message: 'Phone number already in use',
          code: 'PHONE_EXISTS'
        });
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone && phone.trim() ? phone.trim() : null,
        role: role.toUpperCase(),
        isVerified: true
      }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP. Please try again.',
        code: 'INVALID_OTP'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send forgot password OTP
export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Generate and send OTP
    const otpRecord = await emailService.createOtp(normalizedEmail, 'FORGOT_PASSWORD', user.id);
    await emailService.sendOtp(normalizedEmail, otpRecord.code, 'FORGOT_PASSWORD', user.name);

    res.json({
      message: 'Password reset OTP sent successfully to your email',
      email: normalizedEmail,
      expiresAt: otpRecord.expiresAt
    });
  } catch (error) {
    console.error('Send forgot password OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Verify forgot password OTP
export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email address and OTP are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    await emailService.verifyOtp(normalizedEmail, otp, 'FORGOT_PASSWORD');

    // Get user
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short expiry for security
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
      userId: user.id
    });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP. Please try again.',
        code: 'INVALID_OTP'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get user
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isBlocked: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Account blocked',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: 'Email address and type are required' });
    }

    if (!['LOGIN', 'SIGNUP', 'FORGOT_PASSWORD'].includes(type)) {
      return res.status(400).json({ message: 'Invalid OTP type' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // For login and forgot password, check if user exists
    if (type === 'LOGIN' || type === 'FORGOT_PASSWORD') {
      const user = await prisma.user.findUnique({ 
        where: { email: normalizedEmail } 
      });
      if (!user) {
        return res.status(404).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      if (user.isBlocked) {
        return res.status(403).json({ 
          message: 'Account blocked',
          code: 'ACCOUNT_BLOCKED'
        });
      }
    }

    // For signup, check if user doesn't exist
    if (type === 'SIGNUP') {
      const existingUser = await prisma.user.findUnique({ 
        where: { email: normalizedEmail } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists',
          code: 'USER_EXISTS'
        });
      }
    }

    // Generate and send new OTP
    const otpRecord = await emailService.createOtp(normalizedEmail, type);
    const userName = type !== 'SIGNUP' ? 
      (await prisma.user.findUnique({ where: { email: normalizedEmail } }))?.name : '';
    
    await emailService.sendOtp(normalizedEmail, otpRecord.code, type, userName);

    res.json({
      message: 'OTP resent successfully to your email',
      email: normalizedEmail,
      expiresAt: otpRecord.expiresAt
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};