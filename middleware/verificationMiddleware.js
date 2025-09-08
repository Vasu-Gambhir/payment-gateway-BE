const { User } = require("../models/userSchema");

const requireEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: "Email verification required",
        message: "Please verify your email address to access this feature. Check your inbox for the verification link."
      });
    }
    
    next();
  } catch (error) {
    console.error("Error in email verification middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const requirePhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.phoneVerified) {
      return res.status(403).json({ 
        error: "Phone verification required",
        message: "Please verify your phone number to access this feature."
      });
    }
    
    next();
  } catch (error) {
    console.error("Error in phone verification middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const requireFullVerification = async (req, res, next) => {
  try {
    const userId = req.user;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.emailVerified || !user.phoneVerified) {
      return res.status(403).json({ 
        error: "Full verification required",
        message: "Please verify both your email and phone number to access this feature.",
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      });
    }
    
    next();
  } catch (error) {
    console.error("Error in full verification middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  requireEmailVerification,
  requirePhoneVerification,
  requireFullVerification
};