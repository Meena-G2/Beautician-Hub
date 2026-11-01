const express = require("express");
const { body } = require("express-validator");

const { register, login, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .toLowerCase(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit mobile number"),
  body("role")
    .optional()
    .isIn(["customer", "beautician"])
    .withMessage("Role must be customer or beautician"),
];

const loginRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .toLowerCase(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit mobile number"),
];

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateRules, validate, updateMe);

module.exports = router;