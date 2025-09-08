const express = require("express");
const router = express.Router();
const userRouter = require("./userRoutes");
const accountRouter = require("./accountRoutes");

router.use("/users", userRouter);
router.use("/accounts", accountRouter);

module.exports = router;
