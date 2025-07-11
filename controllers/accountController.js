const { default: mongoose } = require("mongoose");
const { Account } = require("../models/accountSchema");

const getAccountBalance = async (userId) => {
  try {
    const account = await Account.findOne({ userId: userId });
    if (!account) {
      return {
        error: "Account not found",
      };
    }
    return {
      balance: account.balance,
    };
  } catch (error) {
    return {
      error: "An error occurred while fetching account balance" + error.message,
    };
  }
};

const transferAmmount = async (senderId, recipientId, amount) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const senderAccount = await Account.findOne({ userId: senderId });
    if (!senderAccount) {
      await session.abortTransaction();
      return {
        error: "Sender account not found",
      };
    }
    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      return {
        error: "Insufficient balance",
      };
    }

    const recipientAccount = await Account.findOne({ userId: recipientId });
    if (!recipientAccount) {
      await session.abortTransaction();
      return {
        error: "Recipient account not found",
      };
    }

    await Account.updateOne(
      { userId: senderId },
      { $inc: { balance: -amount } }
    ).session(session);
    await Account.updateOne(
      { userId: recipientId },
      { $inc: { balance: amount } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Transfer successful",
    };
  } catch (error) {
    return {
      error: "An error occurred while processing the transfer" + error.message,
    };
  }
};

module.exports = {
  getAccountBalance,
  transferAmmount,
};
