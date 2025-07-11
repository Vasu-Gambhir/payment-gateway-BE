const zod = require("zod");

const transferSchema = zod.object({
  amount: zod.number().positive("Amount must be a positive number"),
  recipientId: zod.string().nonempty("Recipient ID is required"),
});

module.exports = {
  transferSchema,
};
