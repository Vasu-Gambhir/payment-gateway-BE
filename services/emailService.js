const nodemailer = require('nodemailer');
const brevo = require('@getbrevo/brevo');
require('dotenv').config();

class EmailService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log(`📧 Initializing email service: ${this.isDevelopment ? 'SMTP (Development)' : 'Brevo (Production)'}`);
    
    if (this.isDevelopment) {
      this.initializeSMTP();
    } else {
      this.initializeBrevo();
    }
  }

  initializeSMTP() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✅ SMTP email service ready');
  }

  initializeBrevo() {
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ Brevo API key not configured');
      return;
    }

    try {
      this.brevoApiInstance = new brevo.TransactionalEmailsApi();
      this.brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
      console.log('✅ Brevo email service ready');
    } catch (error) {
      console.error('❌ Failed to initialize Brevo:', error.message);
      this.brevoApiInstance = null;
    }
  }

  async sendVerificationEmail(email, code) {
    const subject = 'Verify Your Email - Payment Gateway';
    const html = this.generateVerificationHTML(code);

    try {
      if (this.isDevelopment) {
        return await this.sendViaSMTP(email, subject, html);
      } else {
        return await this.sendViaBrevo(email, subject, html);
      }
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email, firstName) {
    const subject = 'Welcome to Payment Gateway!';
    const html = this.generateWelcomeHTML(firstName);

    try {
      if (this.isDevelopment) {
        return await this.sendViaSMTP(email, subject, html);
      } else {
        return await this.sendViaBrevo(email, subject, html);
      }
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      return false; // Don't throw for welcome emails
    }
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    const subject = 'Reset Your Password - Payment Gateway';
    const html = this.generatePasswordResetHTML(resetToken, firstName);

    try {
      if (this.isDevelopment) {
        return await this.sendViaSMTP(email, subject, html);
      } else {
        return await this.sendViaBrevo(email, subject, html);
      }
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendViaSMTP(to, subject, html) {
    if (!this.transporter) {
      throw new Error('SMTP not configured');
    }

    const fromName = process.env.FROM_NAME || 'Payment Gateway';
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: { name: fromName, address: fromEmail },
      to: to,
      subject: subject,
      html: html,
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via SMTP to ${to}`);
    return result;
  }

  async sendViaBrevo(to, subject, html) {
    if (!this.brevoApiInstance) {
      throw new Error('Brevo API not initialized');
    }

    const senderName = process.env.BREVO_SENDER_NAME || process.env.FROM_NAME || 'Payment Gateway';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL || 'noreply@paymentgateway.com';

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to }];

    const result = await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent via Brevo to ${to}`);
    return result;
  }

  generateVerificationHTML(code) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Payment Gateway</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Email Verification</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: white;">
          <h2 style="color: #333; text-align: center; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; text-align: center; font-size: 16px;">
            Thank you for signing up! Please use the verification code below to complete your registration:
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; padding: 25px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
              <div style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</div>
            </div>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px; margin: 30px 0 0 0;">
            This verification code will expire in <strong>24 hours</strong>.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
            If you didn't create an account with us, please ignore this email.
          </p>
          <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Payment Gateway. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  generateWelcomeHTML(firstName) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Payment Gateway! 🎉</h1>
        </div>
        
        <div style="padding: 40px 30px; background-color: white;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${firstName}!</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your account has been successfully created and verified. You can now enjoy all the features of our secure payment platform:
          </p>
          
          <ul style="color: #666; line-height: 1.8; margin: 20px 0; padding-left: 20px;">
            <li>Send and receive money instantly</li>
            <li>Real-time transaction notifications</li>
            <li>Secure account management</li>
            <li>Transaction history and analytics</li>
          </ul>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Payment Gateway. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  generatePasswordResetHTML(resetToken, firstName) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 40px 30px; background-color: white;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${firstName}!</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 20px 0;">
            This password reset link will expire in <strong>1 hour</strong> for security reasons.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;
  }

  async testConnection() {
    try {
      if (this.isDevelopment && this.transporter) {
        await this.transporter.verify();
        return true;
      } else if (!this.isDevelopment && this.brevoApiInstance) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Email service test failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();