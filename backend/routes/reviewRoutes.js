const express = require("express");
const { body } = require("express-validator");

const {
  createReview,
  getBeauticianReviews,
  getReceivedReviews,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const reviewRules = [
  body("bookingId").isMongoId().withMessage("Please choose a valid booking"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a whole number from 1 to 5")
    .toInt(),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment cannot be more than 500 characters"),
];

router.post("/", protect, authorize("customer"), reviewRules, validate, createReview);
router.get("/received", protect, authorize("beautician"), getReceivedReviews);
router.get("/beautician/:beauticianId", getBeauticianReviews);

module.exports = router;