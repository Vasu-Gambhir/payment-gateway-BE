const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  contacts: [
    {
      firstName: String,
      lastName: String,
      phoneNumber: String,
      isRegistered: {
        type: Boolean,
        default: false,
      },
      registeredUserDetails: {
        _id: mongoose.Schema.Types.ObjectId,
        firstName: String,
        lastName: String,
        phone: String,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = {
  User,
};
