const Review = require("../models/Review");
const Booking = require("../models/Booking");

// POST /api/reviews  (customer)
const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (!booking.customer.equals(req.user._id)) {
    res.status(403);
    throw new Error("You can only review your own bookings");
  }

  if (booking.status !== "Completed") {
    res.status(400);
    throw new Error("You can review only completed appointments");
  }

  const existing = await Review.findOne({ booking: booking._id });
  if (existing) {
    res.status(400);
    throw new Error("You have already reviewed this booking");
  }

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    beautician: booking.beautician,
    service: booking.service,
    rating,
    comment,
  });

  res.status(201).json({ success: true, message: "Thank you for your review", review });
};

// GET /api/reviews/beautician/:beauticianId  (public)
const getBeauticianReviews = async (req, res) => {
  const reviews = await Review.find({ beautician: req.params.beauticianId })
    .populate("customer", "name")
    .populate("service", "title")
    .sort("-createdAt");

  res.json({ success: true, count: reviews.length, reviews });
};

// GET /api/reviews/received  (beautician) - reviews about me
const getReceivedReviews = async (req, res) => {
  const reviews = await Review.find({ beautician: req.user._id })
    .populate("customer", "name")
    .populate("service", "title")
    .sort("-createdAt");

  res.json({ success: true, count: reviews.length, reviews });
};

module.exports = { createReview, getBeauticianReviews, getReceivedReviews };