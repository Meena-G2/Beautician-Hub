const express = require("express");
const { body } = require("express-validator");

const {
  getStats,
  getUsers,
  setUserStatus,
  getAllServices,
  getAllBookings,
  getAllReviews,
  deleteReview,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

// Every route in this file is for logged-in admins only
router.use(protect, authorize("admin"));

const statusRules = [
  body("status")
    .isIn(["active", "suspended"])
    .withMessage("Status must be active or suspended"),
];

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/status", statusRules, validate, setUserStatus);
router.get("/services", getAllServices);
router.get("/bookings", getAllBookings);
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;