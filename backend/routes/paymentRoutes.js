const express = require("express");
const { body } = require("express-validator");

const {
  createOrder,
  verifyPayment,
  syncPayment,
  markCashReceived,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const orderRules = [body("bookingId").isMongoId().withMessage("Please choose a valid booking")];

const verifyRules = [
  body("razorpay_order_id").trim().notEmpty().withMessage("Order id is required"),
  body("razorpay_payment_id").trim().notEmpty().withMessage("Payment id is required"),
  body("razorpay_signature").trim().notEmpty().withMessage("Payment signature is required"),
];

router.post("/order", protect, authorize("customer"), orderRules, validate, createOrder);
router.post("/verify", protect, authorize("customer"), verifyRules, validate, verifyPayment);
router.post("/:bookingId/sync", protect, authorize("customer"), syncPayment);
router.put("/:bookingId/cash", protect, authorize("beautician"), markCashReceived);

module.exports = router;