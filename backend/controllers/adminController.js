const User = require("../models/User");
const BeauticianProfile = require("../models/BeauticianProfile");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/stats  (admin) - numbers for the dashboard cards
const getStats = async (req, res) => {
  const [
    customers,
    beauticians,
    services,
    bookings,
    reviews,
    pendingApprovals,
    suspendedUsers,
    statusCounts,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "beautician" }),
    Service.countDocuments(),
    Booking.countDocuments(),
    Review.countDocuments(),
    BeauticianProfile.countDocuments({ approvalStatus: "Pending" }),
    User.countDocuments({ status: "suspended" }),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.find()
      .populate("customer", "name")
      .populate("beautician", "name")
      .sort("-createdAt")
      .limit(5),
  ]);

  const bookingsByStatus = {
    Pending: 0,
    Accepted: 0,
    Rejected: 0,
    Cancelled: 0,
    Completed: 0,
  };
  statusCounts.forEach((s) => {
    bookingsByStatus[s._id] = s.count;
  });

  res.json({
    success: true,
    stats: {
      customers,
      beauticians,
      services,
      bookings,
      reviews,
      pendingApprovals,
      suspendedUsers,
      bookingsByStatus,
    },
    recentBookings,
  });
};

// GET /api/admin/users  (admin)  ?role=customer|beautician ?status=active|suspended ?search=
const getUsers = async (req, res) => {
  const { role, status, search } = req.query;

  const filter = { role: { $ne: "admin" } };
  if (role === "customer" || role === "beautician") filter.role = role;
  if (status === "active" || status === "suspended") filter.status = status;
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const users = await User.find(filter).sort("-createdAt");
  res.json({ success: true, count: users.length, users });
};

// PUT /api/admin/users/:id/status  (admin) - suspend or reactivate an account
const setUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    res.status(403);
    throw new Error("Admin accounts cannot be suspended");
  }

  const { status } = req.body;
  await User.updateOne({ _id: user._id }, { status });

  // A suspended beautician's profile and services must disappear from the website
  if (user.role === "beautician") {
    await BeauticianProfile.updateOne(
      { user: user._id },
      { isSuspended: status === "suspended" }
    );
  }

  res.json({
    success: true,
    message: status === "suspended" ? "Account suspended" : "Account reactivated",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status,
    },
  });
};

// GET /api/admin/services  (admin) - every service, including suspended ones
const getAllServices = async (req, res) => {
  const services = await Service.find()
    .populate("category", "name")
    .populate("beautician", "name email")
    .sort("-createdAt");

  res.json({ success: true, count: services.length, services });
};

// GET /api/admin/bookings  (admin)  ?status= ?date=2026-11-15
const getAllBookings = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.date = req.query.date;

  const bookings = await Booking.find(filter)
    .populate("customer", "name email phone")
    .populate("beautician", "name email phone")
    .populate("service", "title")
    .sort("-createdAt")
    .limit(200);

  res.json({ success: true, count: bookings.length, bookings });
};

// GET /api/admin/reviews  (admin)
const getAllReviews = async (req, res) => {
  const reviews = await Review.find()
    .populate("customer", "name")
    .populate("beautician", "name")
    .populate("service", "title")
    .sort("-createdAt")
    .limit(200);

  res.json({ success: true, count: reviews.length, reviews });
};

// DELETE /api/admin/reviews/:id  (admin) - remove an inappropriate review
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  await review.deleteOne();
  await Review.calcAverageRating(review.beautician); // update the beautician's rating

  res.json({ success: true, message: "Review deleted" });
};

module.exports = {
  getStats,
  getUsers,
  setUserStatus,
  getAllServices,
  getAllBookings,
  getAllReviews,
  deleteReview,
};