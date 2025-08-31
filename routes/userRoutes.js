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
    const user = await createUser(data);
    if (user.error) {
      return res.status(500).json({ error: user.error });
    }

    return res.status(201).json({
      token: user.token,
      user: user.user,
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
    const user = await signinUser(data);
    if (user.error) {
      console.log(user.error);
      return res.status(404).json({ error: user.error });
    }

    return res.status(201).json({
      token: user.token,
      user: user.user,
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

module.exports = router;
