import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import otpService from '../services/otpService.js';

const prisma = new PrismaClient();

// Send OTP for login
export const sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Clean phone number - remove spaces, dashes, and ensure proper format
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Please enter a valid Indian mobile number.' });
    }

    // Normalize phone number
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    normalizedPhone = '+91' + normalizedPhone;

    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { phone: normalizedPhone } 
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
    const otpRecord = await otpService.createOtp(normalizedPhone, 'LOGIN', user.id);
    await otpService.sendOtp(normalizedPhone, otpRecord.code, 'LOGIN');

    res.json({
      message: 'OTP sent successfully',
      phone: normalizedPhone,
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
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Clean and normalize phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    normalizedPhone = '+91' + normalizedPhone;

    // Verify OTP
    await otpService.verifyOtp(normalizedPhone, otp, 'LOGIN');

    // Get user
    const user = await prisma.user.findUnique({ 
      where: { phone: normalizedPhone },
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

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extended to 24 hours for better UX
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
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Clean and validate phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Please enter a valid Indian mobile number.' });
    }

    // Normalize phone number
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    normalizedPhone = '+91' + normalizedPhone;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { phone: normalizedPhone } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this phone number. Please login instead.',
        code: 'USER_EXISTS'
      });
    }

    // Generate and send OTP
    const otpRecord = await otpService.createOtp(normalizedPhone, 'SIGNUP');
    await otpService.sendOtp(normalizedPhone, otpRecord.code, 'SIGNUP');

    res.json({
      message: 'OTP sent successfully',
      phone: normalizedPhone,
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

    if (!name || !phone || !otp) {
      return res.status(400).json({ message: 'Name, phone number and OTP are required' });
    }

    // Clean and normalize phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    normalizedPhone = '+91' + normalizedPhone;

    // Verify OTP
    await otpService.verifyOtp(normalizedPhone, otp, 'SIGNUP');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { phone: normalizedPhone } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this phone number',
        code: 'USER_EXISTS'
      });
    }

    // Check email uniqueness if provided
    if (email && email.trim()) {
      const existingEmailUser = await prisma.user.findUnique({ 
        where: { email: email.trim().toLowerCase() } 
      });
      if (existingEmailUser) {
        return res.status(400).json({ 
          message: 'Email already in use',
          code: 'EMAIL_EXISTS'
        });
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email && email.trim() ? email.trim().toLowerCase() : null,
        phone: normalizedPhone,
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
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ message: 'Phone number and type are required' });
    }

    if (!['LOGIN', 'SIGNUP'].includes(type)) {
      return res.status(400).json({ message: 'Invalid OTP type' });
    }

    // Clean and normalize phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+91')) {
      normalizedPhone = normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    normalizedPhone = '+91' + normalizedPhone;

    // For login, check if user exists
    if (type === 'LOGIN') {
      const user = await prisma.user.findUnique({ 
        where: { phone: normalizedPhone } 
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
        where: { phone: normalizedPhone } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists',
          code: 'USER_EXISTS'
        });
      }
    }

    // Generate and send new OTP
    const otpRecord = await otpService.createOtp(normalizedPhone, type);
    await otpService.sendOtp(normalizedPhone, otpRecord.code, type);

    res.json({
      message: 'OTP resent successfully',
      phone: normalizedPhone,
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