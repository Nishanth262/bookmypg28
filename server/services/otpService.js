import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class OtpService {
  // Generate a 6-digit OTP
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create and store OTP in database
  async createOtp(phone, type, userId = null) {
    try {
      // Delete any existing unused OTPs for this phone and type
      await prisma.otpCode.deleteMany({
        where: {
          phone,
          type,
          isUsed: false
        }
      });

      const code = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const otpRecord = await prisma.otpCode.create({
        data: {
          phone,
          code,
          type,
          expiresAt,
          userId
        }
      });

      console.log(`📱 OTP created for ${phone}: ${code} (Type: ${type})`);
      return otpRecord;
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  // Verify OTP
  async verifyOtp(phone, code, type) {
    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone,
          code,
          type,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        console.log(`❌ OTP verification failed for ${phone}: ${code}`);
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      console.log(`✅ OTP verified successfully for ${phone}`);
      return otpRecord;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  // Send OTP via SMS (Mock implementation)
  async sendOtp(phone, code, type) {
    try {
      // In production, integrate with SMS service like Twilio, AWS SNS, etc.
      console.log(`📱 Sending OTP to ${phone}: ${code} (Type: ${type})`);
      
      // Mock SMS sending - replace with actual SMS service
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Development Mode - OTP for ${phone}: ${code}`);
        return { success: true, message: 'OTP sent successfully' };
      }

      // Example Twilio integration (uncomment and configure)
      /*
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        await client.messages.create({
          body: `Your BookMyPG verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        return { success: true, message: 'OTP sent successfully' };
      } catch (error) {
        console.error('SMS sending failed:', error);
        throw new Error('Failed to send OTP');
      }
      */

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

  // Clean up expired OTPs (run periodically)
  async cleanupExpiredOtps() {
    try {
      const result = await prisma.otpCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw error;
    }
  }
}

export default new OtpService();