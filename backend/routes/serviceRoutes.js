const express = require("express");
const { body } = require("express-validator");

const {
  getServices,
  getMyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  suspendService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

// Same rules for create and update; on update every field is optional
const serviceRules = (isUpdate) => {
  const field = (name) => (isUpdate ? body(name).optional() : body(name));

  return [
    field("title").trim().notEmpty().withMessage("Service title is required"),
    field("category").isMongoId().withMessage("Please choose a valid category"),
    field("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a number, 0 or more"),
    field("durationMinutes")
      .isInt({ min: 15, max: 600 })
      .withMessage("Duration must be between 15 and 600 minutes"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot be more than 500 characters"),
    body("image")
      .optional({ values: "falsy" })
      .isURL()
      .withMessage("Image must be a valid URL"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false"),
  ];
};

const suspendRules = [
  body("isSuspended").isBoolean().withMessage("isSuspended must be true or false"),
];

router.get("/", getServices);
router.get("/mine", protect, authorize("beautician"), getMyServices);
router.get("/:id", getServiceById);
router.post("/", protect, authorize("beautician"), serviceRules(false), validate, createService);
router.put("/:id", protect, authorize("beautician"), serviceRules(true), validate, updateService);
router.delete("/:id", protect, authorize("beautician", "admin"), deleteService);
router.put("/:id/suspend", protect, authorize("admin"), suspendRules, validate, suspendService);

module.exports = router;