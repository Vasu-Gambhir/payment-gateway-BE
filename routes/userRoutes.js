const express = require("express");
const router = express.Router();
const {
  createUser,
  signinUser,
  updateUser,
  getUsers,
  uploadContacts,
  getContacts,
  addContact,
  deleteUserAccount,
  verifyEmail,
  verifyEmailWithCode,
  verifyPhone,
  resendVerification,
} = require("../controllers/userController");
const { signupSchema, signinSchema, updateUserSchema } = require("../zod/user");
const authMiddleware = require("../middleware/middleware");

// Create a new user
router.post("/signup", async (req, res) => {
  try {
    const { success, data } = signupSchema.safeParse(req.body);
    if (!success) {
      return res.status(411).json({ error: "Invalid request data" });
    }
    const result = await createUser(data);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(201).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Validation Error:", error);
    res.status(400).json({ error: "Error while creating new user" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { success, data } = signinSchema.safeParse(req.body);
    if (!success) {
      return res.status(411).json({ error: "Invalid request data" });
    }
    const result = await signinUser(data);
    if (result.error) {
      console.log(result.error);
      // Check if it's a verification error to send specific response
      if (result.needsEmailVerification) {
        return res.status(403).json({
          error: result.error,
          message: result.message,
          needsEmailVerification: true,
          userId: result.userId
        });
      }
      return res.status(404).json({ error: result.error });
    }

    return res.status(200).json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Validation Error:", error);
    res.status(400).json({ error: "unable to login" });
  }
});

// router.put("/updateUser", authMiddleware, async (req, res) => {
//   try {
//     const { success, data } = updateUserSchema.safeParse(req.body);
//     if (!success) {
//       return res.status(411).json({ error: "Invalid request data" });
//     }
//     const updatedUser = await updateUser(data, req.user);
//     if (updatedUser.error) {
//       return res.status(500).json({ error: updatedUser.error });
//     }

//     return res.status(200).json({
//       message: "User information updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Validation Error:", error);
//     res.status(400).json({ error: "unable to update user information" });
//   }
// });

// router.get("/getUser", authMiddleware, async (req, res) => {
//   try {
//     const filter = req.query.filter || "";
//     const requiredUsers = await getUsers(filter);

//     if (!requiredUsers) {
//       return res.status(404).json({ message: "No users found", users: [] });
//     }
//     return res.status(200).json({
//       users: requiredUsers,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ error: "Unable to fetch users" });
//   }
// });

router.post("/uploadContacts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const { csvData, filename } = req.body;

    if (!csvData) {
      return res.status(400).json({ error: "No CSV data provided" });
    }

    const result = await uploadContacts(userId, csvData, filename);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error uploading contacts:", error);
    return res.status(500).json({ error: "Failed to upload contacts" });
  }
});

router.get("/contacts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const filter = req.query.filter || "";
    const statusFilter = req.query.statusFilter || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getContacts(userId, filter, statusFilter, page, limit);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.post("/addContact", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const { firstName, lastName, phoneNumber } = req.body;

    const result = await addContact(userId, firstName, lastName, phoneNumber);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error adding contact:", error);
    return res.status(500).json({ error: "Failed to add contact" });
  }
});

router.delete("/deleteAccount", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;

    const result = await deleteUserAccount(userId);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const result = await verifyEmail(token);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(500).json({ error: "Failed to verify email" });
  }
});

router.post("/verify-email-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const result = await verifyEmailWithCode(email, code);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: result.message,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error("Error verifying email with code:", error);
    return res.status(500).json({ error: "Failed to verify email" });
  }
});

router.post("/verify-phone", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    const result = await verifyPhone(userId, code);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error verifying phone:", error);
    return res.status(500).json({ error: "Failed to verify phone" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!type || !['email', 'phone'].includes(type)) {
      return res.status(400).json({ error: "Invalid verification type" });
    }

    const result = await resendVerification(userId, type);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error resending verification:", error);
    return res.status(500).json({ error: "Failed to resend verification" });
  }
});

module.exports = router;
