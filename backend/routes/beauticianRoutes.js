const express = require("express");
const { body } = require("express-validator");

const {
  getBeauticians,
  getBeauticianById,
  getMyProfile,
  saveMyProfile,
  getAllProfilesAdmin,
  setApprovalStatus,
} = require("../controllers/beauticianController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const profileRules = [
  body("experience")
    .isInt({ min: 0, max: 60 })
    .withMessage("Experience must be a whole number of years between 0 and 60"),
  body("serviceArea").trim().notEmpty().withMessage("Service area is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot be more than 1000 characters"),
  body("photo")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Photo must be a valid URL"),
];

const approvalRules = [
  body("status")
    .isIn(["Approved", "Rejected"])
    .withMessage("Status must be Approved or Rejected"),
];

router.get("/", getBeauticians);
router.get("/admin/all", protect, authorize("admin"), getAllProfilesAdmin);
router.get("/me/profile", protect, authorize("beautician"), getMyProfile);
router.put("/me/profile", protect, authorize("beautician"), profileRules, validate, saveMyProfile);
router.get("/:userId", getBeauticianById);
router.put("/:userId/approval", protect, authorize("admin"), approvalRules, validate, setApprovalStatus);

module.exports = router;