const Category = require("../models/Category");
const Service = require("../models/Service");

// GET /api/categories  (public) - only active categories
const getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort("name");
  res.json({ success: true, count: categories.length, categories });
};

// GET /api/categories/admin/all  (admin) - includes inactive ones
const getAllCategoriesAdmin = async (req, res) => {
  const categories = await Category.find().sort("name");
  res.json({ success: true, count: categories.length, categories });
};

// POST /api/categories  (admin)
const createCategory = async (req, res) => {
  const { name, description, image } = req.body;
  const category = await Category.create({ name, description, image });
  res.status(201).json({ success: true, message: "Category created", category });
};

// PUT /api/categories/:id  (admin)
const updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  ["name", "description", "image", "isActive"].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });

  await category.save();
  res.json({ success: true, message: "Category updated", category });
};

// DELETE /api/categories/:id  (admin)
const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const inUse = await Service.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(400);
    throw new Error(
      `${inUse} service(s) use this category. Deactivate it instead of deleting`
    );
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
};

module.exports = {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};