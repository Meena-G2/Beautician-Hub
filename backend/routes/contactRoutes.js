const express = require("express");
const { body } = require("express-validator");

const {
  createMessage,
  getMessages,
  setRead,
  deleteMessage,
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const messageRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 60 })
    .withMessage("Name cannot be more than 60 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .toLowerCase(),
  body("subject")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subject cannot be more than 100 characters"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),
];

const readRules = [body("isRead").isBoolean().withMessage("isRead must be true or false")];

router.post("/", messageRules, validate, createMessage);
router.get("/", protect, authorize("admin"), getMessages);
router.put("/:id/read", protect, authorize("admin"), readRules, validate, setRead);
router.delete("/:id", protect, authorize("admin"), deleteMessage);

module.exports = router;