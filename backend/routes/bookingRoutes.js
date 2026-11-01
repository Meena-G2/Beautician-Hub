const express = require("express");
const { body } = require("express-validator");

const {
  createBooking,
  getMyBookings,
  getBeauticianBookings,
  getBookingById,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const createRules = [
  body("serviceId").isMongoId().withMessage("Please choose a valid service"),
  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must look like 2026-11-15"),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("Start time must look like 14:30"),
  body("address.street").trim().notEmpty().withMessage("Street address is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.pincode")
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be 6 digits"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Notes cannot be more than 300 characters"),
];

const statusRules = [
  body("status")
    .isIn(["Accepted", "Rejected", "Cancelled", "Completed"])
    .withMessage("Status must be Accepted, Rejected, Cancelled or Completed"),
];

router.post("/", protect, authorize("customer"), createRules, validate, createBooking);
router.get("/my", protect, authorize("customer"), getMyBookings);
router.get("/beautician", protect, authorize("beautician"), getBeauticianBookings);
router.get("/:id", protect, getBookingById);
router.put("/:id/status", protect, authorize("customer", "beautician"), statusRules, validate, updateBookingStatus);

module.exports = router;