const mongoose = require("mongoose");

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    beautician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    // Copies saved at booking time, so old bookings stay correct
    // even if the beautician later changes the service price or name
    serviceTitle: { type: String, required: true },
    price: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },

    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must look like 2026-11-15"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [timeRegex, "Start time must look like 14:30"],
    },
    endTime: {
      type: String,
      required: true,
      match: [timeRegex, "End time must look like 15:30"],
    },
    address: {
      street: { type: String, required: [true, "Street address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^\d{6}$/, "Pincode must be 6 digits"],
      },
    },
    notes: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
    },

    // ----- Payment -----
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },
    paymentMethod: { type: String, enum: ["Online", "Cash"] },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

// Safety net against double booking: the same beautician cannot have two
// active bookings starting at the same date and time.
// (The controller will also check overlapping times.)
bookingSchema.index(
  { beautician: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["Pending", "Accepted"] } },
  }
);

module.exports = mongoose.model("Booking", bookingSchema);