const epxress = require("express");
const {
  getAccountBalance,
  transferAmmount,
} = require("../controllers/accountController");
const authMiddleware = require("../middleware/middleware");
const { transferSchema } = require("../zod/account");
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
    console.log(typeof req.body.amount);
    const { success, data } = transferSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    console.log("data", data);
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

module.exports = router;
