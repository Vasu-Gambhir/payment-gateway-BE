const zod = require("zod");

const signupSchema = zod.object({
  username: zod
    .string()
    .email("Invalid email format")
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must not exceed 30 characters")
    .trim()
    .toLowerCase(),
  firstName: zod
    .string()
    .max(50, "First name must not exceed 50 characters")
    .trim(),
  lastName: zod
    .string()
    .max(50, "Last name must not exceed 50 characters")
    .trim(),
  password: zod.string().min(6, "Password must be at least 6 characters long"),
  phone: zod.string().nonempty("Phone number is required"),
});

const signinSchema = zod.object({
  username: zod.string().email("Invalid email format").trim().toLowerCase(),
  password: zod.string().trim(),
});

const updateUserSchema = zod.object({
  firstName: zod
    .string()
    .max(50, "First name must not exceed 50 characters")
    .trim()
    .optional(),
  lastName: zod
    .string()
    .max(50, "Last name must not exceed 50 characters")
    .trim()
    .optional(),
  password: zod
    .string()
    .min(6, "Password must be at least 6 characters long")
    .optional(),
  phone: zod.string().nonempty("Phone number is required").optional(),
});

module.exports = {
  signupSchema,
  signinSchema,
  updateUserSchema,
};
