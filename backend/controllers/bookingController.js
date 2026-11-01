const Booking = require("../models/Booking");
const Service = require("../models/Service");
const BeauticianProfile = require("../models/BeauticianProfile");
const User = require("../models/User");
const Review = require("../models/Review");
const {
  getAvailableSlots,
  isValidDate,
  toMinutes,
  toTime,
} = require("./availabilityController");

const { refundPayment } = require("../config/razorpay");

const CANCEL_NOTICE_HOURS = 24; // customers must cancel accepted bookings this early

// The exact moment an appointment starts (India time)
const appointmentStart = (booking) =>
  new Date(`${booking.date}T${booking.startTime}:00+05:30`);

// POST /api/bookings  (customer)
const createBooking = async (req, res) => {
  const { serviceId, date, startTime, address, notes } = req.body;

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive || service.isSuspended) {
    res.status(404);
    throw new Error("This service is not available");
  }

  const profile = await BeauticianProfile.findOne({ user: service.beautician });
  const beauticianUser = await User.findById(service.beautician);
  if (
    !profile ||
    profile.approvalStatus !== "Approved" ||
    profile.isSuspended ||
    !beauticianUser ||
    beauticianUser.status !== "active"
  ) {
    res.status(400);
    throw new Error("This beautician is not accepting bookings right now");
  }

  if (!isValidDate(date)) {
    res.status(400);
    throw new Error("Please give a valid date like 2026-11-15");
  }

  // The server decides if the time is really free
  const slots = await getAvailableSlots(service.beautician, date, service.durationMinutes);
  if (!slots.includes(startTime)) {
    res.status(409);
    throw new Error("That time slot is not available. Please choose another");
  }

  const endTime = toTime(toMinutes(startTime) + service.durationMinutes);

  let booking;
  try {
    booking = await Booking.create({
      customer: req.user._id,
      beautician: service.beautician,
      service: service._id,
      serviceTitle: service.title, // copied so old bookings keep their details
      price: service.price,
      durationMinutes: service.durationMinutes,
      date,
      startTime,
      endTime,
      address,
      notes,
    });
  } catch (error) {
    // Two customers clicked at the same moment; the database index stopped the second
    if (error.code === 11000) {
      res.status(409);
      throw new Error("That slot was just booked by someone else. Please choose another");
    }
    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Booking request sent. Waiting for the beautician to accept",
    booking,
  });
};

// GET /api/bookings/my  (customer)  ?status=Pending|Accepted|...
const getMyBookings = async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const bookings = await Booking.find(filter)
    .populate("beautician", "name phone")
    .populate("service", "title image")
    .sort("-date -startTime")
    .lean();

  // Tell the frontend which completed bookings already have a review
  const reviews = await Review.find({
    booking: { $in: bookings.map((b) => b._id) },
  }).select("booking");
  const reviewed = new Set(reviews.map((r) => r.booking.toString()));
  bookings.forEach((b) => {
    b.hasReview = reviewed.has(b._id.toString());
  });

  res.json({ success: true, count: bookings.length, bookings });
};

// GET /api/bookings/beautician  (beautician)  ?status=
const getBeauticianBookings = async (req, res) => {
  const filter = { beautician: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const bookings = await Booking.find(filter)
    .populate("customer", "name phone")
    .populate("service", "title")
    .sort("-date -startTime");

  res.json({ success: true, count: bookings.length, bookings });
};

// GET /api/bookings/:id  (the customer, the beautician of that booking, or admin)
const getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("customer", "name phone")
    .populate("beautician", "name phone")
    .populate("service", "title image");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  const userId = req.user._id.toString();
  const allowed =
    req.user.role === "admin" ||
    booking.customer._id.toString() === userId ||
    booking.beautician._id.toString() === userId;

  if (!allowed) {
    res.status(403);
    throw new Error("You can only view your own bookings");
  }

  res.json({ success: true, booking });
};

// PUT /api/bookings/:id/status  (customer or beautician of that booking)
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  const isCustomer =
    req.user.role === "customer" && booking.customer.equals(req.user._id);
  const isBeautician =
    req.user.role === "beautician" && booking.beautician.equals(req.user._id);

  if (!isCustomer && !isBeautician) {
    res.status(403);
    throw new Error("You can only update your own bookings");
  }

  // Who can move a booking from which status to which
  const allowedChanges = isCustomer
    ? { Pending: ["Cancelled"], Accepted: ["Cancelled"] }
    : { Pending: ["Accepted", "Rejected"], Accepted: ["Completed", "Cancelled"] };

  if (!(allowedChanges[booking.status] || []).includes(status)) {
    res.status(400);
    throw new Error(`A ${booking.status} booking cannot be changed to ${status}`);
  }

  // Cancellation rule for customers
  if (isCustomer && booking.status === "Accepted") {
    const hoursLeft = (appointmentStart(booking) - Date.now()) / 3600000;
    if (hoursLeft < CANCEL_NOTICE_HOURS) {
      res.status(400);
      throw new Error(
        `Accepted bookings can only be cancelled at least ${CANCEL_NOTICE_HOURS} hours before the appointment`
      );
    }
  }

  // Completion rule: the appointment must have started
  if (status === "Completed" && Date.now() < appointmentStart(booking)) {
    res.status(400);
    throw new Error("You can mark an appointment as completed only after it has started");
  }

  
    // A paid online booking that gets cancelled is refunded in full
  if (
    status === "Cancelled" &&
    booking.paymentStatus === "Paid" &&
    booking.paymentMethod === "Online"
  ) {
    let refund;
    try {
      refund = await refundPayment(booking.razorpayPaymentId, booking.price);
    } catch (error) {
      res.status(502);
      throw new Error(
        "The refund could not be started, so the booking was not cancelled. Please try again."
      );
    }
    booking.paymentStatus = "Refunded";
    booking.razorpayRefundId = refund.id;
    booking.refundedAt = new Date();
  }

  booking.status = status;
  await booking.save();

  res.json({ success: true, message: `Booking ${status.toLowerCase()}`, booking });
};

module.exports = {
  createBooking,
  getMyBookings,
  getBeauticianBookings,
  getBookingById,
  updateBookingStatus,
};