import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EmailService {
  constructor() {
    // Create reusable transporter object using SMTP transport
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASS, // Your email password or app password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Generate a 6-digit OTP
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create and store OTP in database
  async createOtp(email, type, userId = null) {
    try {
      // Delete any existing unused OTPs for this email and type
      await prisma.otpCode.deleteMany({
        where: {
          phone: email, // Using phone field for email (legacy compatibility)
          type,
          isUsed: false
        }
      });

      const code = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const otpRecord = await prisma.otpCode.create({
        data: {
          phone: email, // Using phone field for email
          code,
          type,
          expiresAt,
          userId
        }
      });

      console.log(`📧 OTP created for ${email}: ${code} (Type: ${type})`);
      return otpRecord;
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  // Verify OTP
  async verifyOtp(email, code, type) {
    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone: email, // Using phone field for email
          code,
          type,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        console.log(`❌ OTP verification failed for ${email}: ${code}`);
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      console.log(`✅ OTP verified successfully for ${email}`);
      return otpRecord;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  // Send OTP via Email
  async sendOtp(email, code, type, userName = '') {
    try {
      const subject = this.getEmailSubject(type);
      const htmlContent = this.getEmailTemplate(code, type, userName);

      const mailOptions = {
        from: {
          name: 'BookMyPG',
          address: process.env.SMTP_USER
        },
        to: email,
        subject: subject,
        html: htmlContent,
        text: `Your BookMyPG verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`
      };

      console.log(`📧 Sending OTP to ${email}: ${code} (Type: ${type})`);
      
      // In development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Development Mode - OTP for ${email}: ${code}`);
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      
      return { success: true, message: 'OTP sent successfully', messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  // Get email subject based on OTP type
  getEmailSubject(type) {
    switch (type) {
      case 'LOGIN':
        return 'BookMyPG - Login Verification Code';
      case 'SIGNUP':
        return 'BookMyPG - Account Verification Code';
      case 'FORGOT_PASSWORD':
        return 'BookMyPG - Password Reset Code';
      default:
        return 'BookMyPG - Verification Code';
    }
  }

  // Get HTML email template
  getEmailTemplate(code, type, userName) {
    const actionText = type === 'LOGIN' ? 'sign in to' : 
                      type === 'SIGNUP' ? 'create' : 'reset password for';
    
    const greeting = userName ? `Hi ${userName},` : 'Hello,';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BookMyPG Verification Code</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #7c3aed;
                margin-bottom: 10px;
            }
            .otp-code {
                background-color: #f3f4f6;
                border: 2px dashed #7c3aed;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-number {
                font-size: 32px;
                font-weight: bold;
                color: #7c3aed;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background-color: #7c3aed;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📍 BookMyPG</div>
                <h2>Verification Code</h2>
            </div>
            
            <p>${greeting}</p>
            
            <p>You requested to ${actionText} your BookMyPG account. Please use the verification code below:</p>
            
            <div class="otp-code">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
                <div class="otp-number">${code}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <p>Enter this code in the BookMyPG app to complete your ${type.toLowerCase()} process.</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>BookMyPG will never ask for this code via phone or email</li>
                    <li>This code expires in 10 minutes</li>
                </ul>
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
            
            <div class="footer">
                <p>This is an automated message from BookMyPG.<br>
                Please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} BookMyPG. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
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

export default new EmailService();