const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balanceCents: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Balance must be a non-negative integer (cents)'
    }
  },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = {
  Account,
};
