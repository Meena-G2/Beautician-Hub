const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // one review per booking
    },
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Recalculate a beautician's average rating and review count
reviewSchema.statics.calcAverageRating = async function (beauticianId) {
  const stats = await this.aggregate([
    { $match: { beautician: new mongoose.Types.ObjectId(beauticianId) } },
    {
      $group: {
        _id: "$beautician",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const BeauticianProfile = mongoose.model("BeauticianProfile");
  await BeauticianProfile.findOneAndUpdate(
    { user: beauticianId },
    {
      averageRating: stats.length ? Math.round(stats[0].avg * 10) / 10 : 0,
      totalReviews: stats.length ? stats[0].count : 0,
    }
  );
};

// Run it automatically after every new review is saved
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRating(this.beautician);
});

module.exports = mongoose.model("Review", reviewSchema);