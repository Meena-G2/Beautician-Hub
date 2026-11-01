const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    beautician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 500 },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
      max: [600, "Duration cannot be more than 600 minutes"],
    },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false }, // admin can suspend a listing
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);