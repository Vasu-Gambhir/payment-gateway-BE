const { default: mongoose } = require("mongoose");
const { Account } = require("../models/accountSchema");
const { Transaction } = require("../models/transcationScehma");
const { dollarsToCents, centsToDollars, isValidCentsAmount } = require("../utils/moneyUtils");

const getAccountBalance = async (userId) => {
  try {
    const account = await Account.findOne({ userId: userId });
    if (!account) {
      return {
        error: "Account not found",
      };
    }
    
    // Return balance in dollars for API compatibility
    return {
      balance: centsToDollars(account.balanceCents),
    };
  } catch (error) {
    return {
      error: "An error occurred while fetching account balance" + error.message,
    };
  }
};

const transferAmmount = async (senderId, recipientId, amount) => {
  try {
    // Convert amount to cents for precise calculations
    const amountCents = dollarsToCents(amount);
    
    if (!isValidCentsAmount(amountCents)) {
      return {
        error: "Invalid transfer amount",
      };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const senderAccount = await Account.findOne({ userId: senderId });
    if (!senderAccount) {
      await session.abortTransaction();
      return {
        error: "Sender account not found",
      };
    }
    
    if (senderAccount.balanceCents < amountCents) {
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

    // Update balances using cents for precision
    await Account.updateOne(
      { userId: senderId },
      { $inc: { balanceCents: -amountCents } }
    ).session(session);
      
    await Account.updateOne(
      { userId: recipientId },
      { $inc: { balanceCents: amountCents } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Transfer successful",
    };
  } catch (error) {
    console.log(error);
    return {
      error: "An error occurred while processing the transfer" + error.message,
    };
  }
};

const getTransactions = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    })
      .populate("fromUserId", "firstName lastName phone")
      .populate("toUserId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(transactions.length);

    const totalTransactions = await Transaction.countDocuments({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });

    // since we receive transactions as array mongoose documents rather than
    // plain js objects and we want to update it, we need to first convert it into
    // plain js object and then add the type of the transation to it
    const transactionsWithType = transactions.map((transaction) => {
      const transactionObj = transaction.toObject();
      transactionObj.type =
        transaction.fromUserId._id.toString() === userId ? "sent" : "received";
      return transactionObj;
    });

    return {
      transactions: transactionsWithType,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { error: "An error occurred while fetching transactions" };
  }
};

module.exports = {
  getAccountBalance,
  transferAmmount,
  getTransactions,
};
