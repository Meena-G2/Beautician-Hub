const express = require("express");
const { body } = require("express-validator");

const {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

const createRules = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Description cannot be more than 300 characters"),
  body("image")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Image must be a valid URL"),
];

const updateRules = [
  body("name").optional().trim().notEmpty().withMessage("Category name cannot be empty"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Description cannot be more than 300 characters"),
  body("image")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Image must be a valid URL"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
];

router.get("/", getCategories);
router.get("/admin/all", protect, authorize("admin"), getAllCategoriesAdmin);
router.post("/", protect, authorize("admin"), createRules, validate, createCategory);
router.put("/:id", protect, authorize("admin"), updateRules, validate, updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;