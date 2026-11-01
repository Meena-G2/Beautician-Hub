const express = require("express");
const { body } = require("express-validator");

const {
  getMyAvailability,
  saveMyAvailability,
  getSlots,
} = require("../controllers/availabilityController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleRules = [
  body("schedule")
    .isArray({ min: 1, max: 7 })
    .withMessage("Schedule must be a list of 1 to 7 days"),
  body("schedule.*.dayOfWeek")
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be 0 (Sunday) to 6 (Saturday)")
    .toInt(),
  body("schedule.*.startTime")
    .matches(timeRegex)
    .withMessage("Start time must look like 09:00"),
  body("schedule.*.endTime")
    .matches(timeRegex)
    .withMessage("End time must look like 18:00"),
  body("schedule.*.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

router.get("/me", protect, authorize("beautician"), getMyAvailability);
router.put("/me", protect, authorize("beautician"), scheduleRules, validate, saveMyAvailability);
router.get("/:beauticianId/slots", getSlots);

module.exports = router;