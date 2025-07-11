const { User } = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Account } = require("../models/accountSchema");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;

const createUser = async (data) => {
  try {
    const { username, firstName, lastName, password, phone } = data;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return {
        error: "User already exists",
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user
    const newUser = await User.create({
      username,
      firstName,
      lastName,
      password: hashedPassword,
      phone,
    });

    // Create an account for the new user with a random balance
    await Account.create({
      userId: newUser._id,
      balance: 1 + Math.random() * 10000,
    });

    // Generate a JWT token
    const token = jwt.sign({ id: newUser._id }, jwtSecret, { expiresIn: "1h" });

    // Return the user data and token
    return {
      user: {
        id: newUser._id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
      },
      token,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      error: "User creation failed",
    };
  }
};

const signinUser = async (data) => {
  try {
    const { username, password } = data;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return {
        error: "User not found",
      };
    }
    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        error: "Invalid password",
      };
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1h" });

    // Return the user data and token
    return {
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      token,
    };
  } catch (error) {
    console.error("Error signing in user:", error);
    return {
      error: "User sign-in failed",
    };
  }
};

const updateUser = async (data, userId) => {
  try {
    const { firstName, lastName, password, phone } = data;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return {
        error: "User not found",
      };
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (phone) user.phone = phone;

    // Save the updated user
    const updatedUser = await user.save();

    return {
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
      },
    };
  } catch (error) {}
};

const getUsers = async (filters) => {
  try {
    // Find users based on filters
    const users = await User.find({
      $or: [
        {
          firstName: {
            $regex: filters,
          },
        },
        {
          lastName: {
            $regex: filters,
          },
        },
      ],
    });
    console.log("Users found:", users);

    return users.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

module.exports = {
  createUser,
  signinUser,
  updateUser,
  getUsers,
};
