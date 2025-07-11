import { z } from 'zod';

const emailSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .transform(email => email.toLowerCase().trim())
});

const emailOtpSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .transform(email => email.toLowerCase().trim()),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits')
    .optional()
});

const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .transform(name => name.trim()),
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .transform(email => email.toLowerCase().trim()),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[+]?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  role: z.enum(['USER', 'OWNER', 'ADMIN']).optional()
});

const propertySchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  stateId: z.string(),
  district: z.string(),
  districtId: z.string(),
  pincode: z.string(),
  singleRooms: z.number().min(0),
  doubleRooms: z.number().min(0),
  tripleRooms: z.number().min(0),
  quadRooms: z.number().min(0),
  singlePrice: z.number().positive(),
  doublePrice: z.number().positive(),
  triplePrice: z.number().positive(),
  quadPrice: z.number().positive(),
  deposit: z.number().positive(),
  amenities: z.array(z.string()),
  images: z.array(z.string().url())
});

const bookingSchema = z.object({
  propertyId: z.string(),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']),
  startMonth: z.number().min(1).max(12),
  startYear: z.number().min(2024),
  durationMonths: z.number().min(1).max(12)
});

export const validateEmail = (req, res, next) => {
  try {
    emailSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      message: 'Validation error', 
      errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    });
  }
};

export const validateEmailOtp = (req, res, next) => {
  try {
    // For send OTP requests, only validate email
    if (req.path.includes('send-otp') || req.path.includes('resend-otp')) {
      emailSchema.parse(req.body);
    } else {
      // For verify OTP requests, validate both email and OTP
      emailOtpSchema.parse(req.body);
    }
    next();
  } catch (error) {
    res.status(400).json({ 
      message: 'Validation error', 
      errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    });
  }
};

export const validateSignupData = (req, res, next) => {
  try {
    signupSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      message: 'Validation error', 
      errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
    });
  }
};

export const validateProperty = (req, res, next) => {
  try {
    propertySchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  }
};

export const validateBooking = (req, res, next) => {
  try {
    bookingSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  }
};