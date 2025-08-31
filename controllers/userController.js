const { User } = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Account } = require("../models/accountSchema");
const { Transaction } = require("../models/transcationScehma");
const { normalizePhoneNumber } = require("../utils/utils");
require("dotenv").config();
const csv = require("csvtojson");

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
    // Create a new user with normalized phone number
    const newUser = await User.create({
      username,
      firstName,
      lastName,
      password: hashedPassword,
      phone: normalizePhoneNumber(phone),
    });

    // Create an account for the new user with a random balance
    await Account.create({
      userId: newUser._id,
      balance: 1 + Math.random() * 10000,
    });

    // Update this user's status to registered in other users' contacts
    const normalizedNewUserPhone = normalizePhoneNumber(phone);
    await User.updateMany(
      { "contacts.phoneNumber": normalizedNewUserPhone },
      {
        $set: {
          "contacts.$[elem].isRegistered": true,
          "contacts.$[elem].registeredUserDetails": {
            _id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: normalizedNewUserPhone,
          },
        },
      },
      {
        arrayFilters: [{ "elem.phoneNumber": normalizedNewUserPhone }],
      }
    );

    // Generate a JWT token
    const token = jwt.sign({ id: newUser._id }, jwtSecret, {
      expiresIn: "24h",
    });

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
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "24h" });

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

// const updateUser = async (data, userId) => {
//   try {
//     const { firstName, lastName, password, phone } = data;

//     // Find the user by ID
//     const user = await User.findById(userId);
//     if (!user) {
//       return {
//         error: "User not found",
//       };
//     }

//     // Update user fields
//     if (firstName) user.firstName = firstName;
//     if (lastName) user.lastName = lastName;
//     if (password) user.password = await bcrypt.hash(password, 10);
//     if (phone) user.phone = normalizePhoneNumber(phone);

//     // Save the updated user
//     const updatedUser = await user.save();

//     return {
//       user: {
//         id: updatedUser._id,
//         username: updatedUser.username,
//         firstName: updatedUser.firstName,
//         lastName: updatedUser.lastName,
//         phone: updatedUser.phone,
//       },
//     };
//   } catch (error) {}
// };

// const getUsers = async (filters) => {
//   try {
//     // Find users based on filters
//     const users = await User.find({
//       $or: [
//         {
//           firstName: {
//             $regex: filters,
//           },
//         },
//         {
//           lastName: {
//             $regex: filters,
//           },
//         },
//       ],
//     });

//     return users.map((user) => ({
//       id: user._id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       phone: user.phone,
//     }));
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return [];
//   }
// };

const uploadContacts = async (userId, csvData, filename) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    console.log(csvData, filename);

    // User's phone is already normalized in the database
    const userNormalizedPhone = user.phone;

    let allContacts = [];
    const uploadResults = [];

    try {
      // Parse CSV data directly from string
      const jsonArray = await csv().fromString(csvData);

      const contacts = jsonArray
        .map((row) => {
          const rawPhone =
            row.phoneNumber ||
            row["Phone Number"] ||
            row["Phone 1 - Value"] ||
            row.phone ||
            row.Phone ||
            row.mobile ||
            "";

          return {
            firstName:
              row.firstName || row["First Name"] || row.first_name || "",
            lastName: row.lastName || row["Last Name"] || row.last_name || "",
            phoneNumber: rawPhone ? normalizePhoneNumber(rawPhone) : "",
          };
        })
        .filter((contact) => contact.phoneNumber)
        .filter((contact) => {
          // Exclude user's own phone number (already normalized)
          return contact.phoneNumber !== userNormalizedPhone;
        });

      allContacts = allContacts.concat(contacts);

      uploadResults.push({
        filename: filename || "uploaded.csv",
        contactsCount: contacts.length,
        status: "success",
      });
    } catch (error) {
      uploadResults.push({
        filename: filename || "uploaded.csv",
        contactsCount: 0,
        status: "error",
        error: error.message,
      });
    }

    const existingPhoneNumbers = new Set(
      user.contacts.map((contact) => contact.phoneNumber)
    );

    const newContacts = allContacts.filter(
      (contact) => !existingPhoneNumbers.has(contact.phoneNumber)
    );

    if (newContacts.length > 0) {
      // Get all registered users to check registration status for new contacts
      const allUserPhones = await User.find({}, "phone firstName lastName _id");
      const phoneToUserMap = new Map();
      allUserPhones.forEach((u) => {
        // User phones are already normalized in the database
        phoneToUserMap.set(u.phone, {
          _id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
        });
      });

      // Set registration status for new contacts before saving
      const contactsToAdd = newContacts.map((contact) => {
        // phoneNumber is already normalized
        const registeredUser = phoneToUserMap.get(contact.phoneNumber);
        return {
          ...contact,
          isRegistered: !!registeredUser,
          registeredUserDetails: registeredUser || null,
        };
      });

      user.contacts.push(...contactsToAdd);
      await user.save();
    }

    // Return contacts with their stored registration status
    const contactsWithStatus = user.contacts.map((contact) =>
      contact.toObject()
    );

    return {
      message: "Contacts uploaded successfully",
      uploadResults,
      totalNewContacts: newContacts.length,
      totalContacts: user.contacts.length,
      contacts: contactsWithStatus,
    };
  } catch (error) {
    console.error("Error uploading contacts:", error);
    return { error: "Failed to upload contacts" };
  }
};

const getContacts = async (
  userId,
  filter = "",
  statusFilter = "all",
  page = 1,
  limit = 10
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    // Using the stored registration status from the database
    // No need to query all users anymore
    const contactsWithStatus = user.contacts.map((contact) =>
      contact.toObject()
    );

    const skip = (page - 1) * limit;

    let filteredContacts = contactsWithStatus;

    // Filter out by names
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filteredContacts = filteredContacts.filter(
        (contact) =>
          contact.firstName.toLowerCase().includes(lowerFilter) ||
          contact.lastName.toLowerCase().includes(lowerFilter) ||
          contact.phoneNumber.includes(filter)
      );
    }

    // Filter out by checking if the user is registered or not
    if (statusFilter === "registered") {
      filteredContacts = filteredContacts.filter(
        (contact) => contact.isRegistered
      );
    } else if (statusFilter === "invitable") {
      filteredContacts = filteredContacts.filter(
        (contact) => !contact.isRegistered
      );
    }

    const totalContacts = filteredContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);

    // rather than doing pagination at the database level, we are doing it here.
    const paginatedContacts = filteredContacts.slice(skip, skip + limit);

    const allContactsCount = contactsWithStatus.length;
    const registeredCount = contactsWithStatus.filter(
      (contact) => contact.isRegistered
    ).length;
    const invitableCount = contactsWithStatus.filter(
      (contact) => !contact.isRegistered
    ).length;

    return {
      contacts: paginatedContacts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalContacts: totalContacts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        all: allContactsCount,
        registered: registeredCount,
        invitable: invitableCount,
      },
    };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { error: "Failed to fetch contacts" };
  }
};

const addContact = async (userId, firstName, lastName, phoneNumber) => {
  try {
    // Validation
    if (!firstName || !lastName || !phoneNumber) {
      return {
        error: "First name, last name, and phone number are required",
      };
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return { error: "Please enter a valid phone number" };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Normalize the phone number for storage
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    // User's phone is already normalized in the database
    const userNormalizedPhone = user.phone;

    // Check if user is trying to add their own phone number
    if (normalizedPhone === userNormalizedPhone) {
      return {
        error: "You cannot add your own phone number as a contact",
      };
    }

    // Check if contact already exists (phone numbers are already normalized)
    const existingContact = user.contacts.find(
      (contact) => contact.phoneNumber === normalizedPhone
    );

    if (existingContact) {
      return {
        error: "Contact with this phone number already exists",
      };
    }

    // Check if the contact is a registered user before adding
    const allUserPhones = await User.find({}, "phone firstName lastName _id");
    const phoneToUserMap = new Map();
    allUserPhones.forEach((u) => {
      // User phones are already normalized in the database
      phoneToUserMap.set(u.phone, {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
      });
    });

    const registeredUser = phoneToUserMap.get(normalizedPhone);

    // Create contact with registration status (store normalized phone number)
    const newContact = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: normalizedPhone, // Store normalized version
      isRegistered: !!registeredUser,
      registeredUserDetails: registeredUser || null,
    };

    user.contacts.push(newContact);
    await user.save();

    const contactWithStatus = newContact;

    return {
      message: "Contact added successfully",
      contact: contactWithStatus,
    };
  } catch (error) {
    console.error("Error adding contact:", error);
    return { error: "Failed to add contact" };
  }
};

const deleteUserAccount = async (userId) => {
  try {
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Check if user has any balance remaining in their account
    const account = await Account.findOne({ userId: userId });
    if (account && account.balance > 0) {
      return {
        error: `Cannot delete account with remaining balance of $${account.balance.toFixed(
          2
        )}. Please transfer or withdraw your balance first.`,
      };
    }

    // Delete all transactions involving this user
    await Transaction.deleteMany({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });

    // Update this user's status to unregistered in other users' contacts
    await User.updateMany(
      { "contacts.phoneNumber": user.phone },
      {
        $set: {
          "contacts.$[elem].isRegistered": false,
          "contacts.$[elem].registeredUserDetails": null,
        },
      },
      {
        arrayFilters: [{ "elem.phoneNumber": user.phone }],
      }
    );

    // Delete the user's account (balance record)
    await Account.findOneAndDelete({ userId: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    return {
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }
};

module.exports = {
  createUser,
  signinUser,
  // updateUser,
  // getUsers,
  uploadContacts,
  getContacts,
  addContact,
  deleteUserAccount,
};
