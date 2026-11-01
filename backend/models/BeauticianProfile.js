const mongoose = require("mongoose");

const beauticianProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per beautician
    },
    photo: { type: String, default: "" },
    experience: {
      type: Number,
      required: [true, "Experience (in years) is required"],
      min: [0, "Experience cannot be negative"],
      max: [60, "Please enter a realistic value"],
    },
    serviceArea: {
      type: String,
      required: [true, "Service area is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    isSuspended: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BeauticianProfile", beauticianProfileSchema);