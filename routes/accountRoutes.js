const epxress = require("express");
const {
  getAccountBalance,
  transferAmmount,
  getTransactions,
} = require("../controllers/accountController");
const authMiddleware = require("../middleware/middleware");
const { transferSchema } = require("../zod/account");
const { Transaction } = require("../models/transcationScehma");
const router = epxress.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const balance = await getAccountBalance(userId);
    if (balance.error) {
      return res.status(400).json({ error: balance.error });
    }
    return res.status(200).json({ balance: balance.balance });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching account balance" });
  }
});

router.post("/transfer", authMiddleware, async (req, res) => {
  try {
    const { success, data } = transferSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const { recipientId, amount } = data;
    const userId = req.user;

    // Validate request data
    if (!recipientId || recipientId === userId) {
      return res
        .status(400)
        .json({ error: "Please provide valid recipient ID" });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Please provide a valid amount" });
    }

    const response = await transferAmmount(userId, recipientId, amount);

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    const newtransaction = await Transaction.create({
      fromUserId: userId,
      toUserId: recipientId,
      ammount: amount,
    });
    console.log(newtransaction);
    return res
      .status(200)
      .json({ message: response.message || "Transfer successful" });
  } catch (error) {
    console.error("Error processing transfer:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the transfer" });
  }
});

router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getTransactions(userId, page, limit);
    
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching transactions" });
  }
});

module.exports = router;
