const crypto = require('crypto');
const emailService = require('./emailService');

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailVerification = async (email, code) => {
  try {
    await emailService.sendVerificationEmail(email, code);
    console.log(`Verification email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (email, firstName) => {
  try {
    await emailService.sendWelcomeEmail(email, firstName);
    console.log(`Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email to avoid breaking user registration
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  try {
    await emailService.sendPasswordResetEmail(email, resetToken, firstName);
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

const sendSMSVerification = async (phone, code) => {
  // SMS implementation placeholder
  console.log(`SMS Verification Code for ${phone}: ${code}`);
  return true;
};

module.exports = {
  generateVerificationToken,
  generateVerificationCode,
  sendEmailVerification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSMSVerification,
};