const mongoose = require("mongoose");

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour "HH:MM"

const availabilitySchema = new mongoose.Schema(
  {
    beautician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: [true, "Day of week is required"],
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [timeRegex, "Start time must look like 09:00"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [timeRegex, "End time must look like 18:00"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One availability row per beautician per weekday
availabilitySchema.index({ beautician: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);