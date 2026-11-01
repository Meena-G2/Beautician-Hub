const crypto = require("crypto");
const Booking = require("../models/Booking");
const razorpay = require("../config/razorpay");

const MIN_RUPEES = 1;
const MAX_RUPEES = 500000; // Razorpay's limit for one payment

// Razorpay errors are not normal Error objects, so we read them carefully
const describeError = (error) =>
  error?.error?.description || error?.message || "Unknown error";

const ensureConfigured = (res) => {
  if (!razorpay.isConfigured()) {
    res.status(503);
    throw new Error("Online payments are not available right now");
  }
};

// Timing-safe comparison of two texts
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Razorpay signs "orderId|paymentId" with our secret key
const paymentSignatureIsValid = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature || "");
};

const markPaid = async (booking, paymentId) => {
  booking.paymentStatus = "Paid";
  booking.paymentMethod = "Online";
  booking.razorpayPaymentId = paymentId;
  booking.paidAt = new Date();
  await booking.save();
};

// Asks Razorpay itself about the payment. Marks the booking paid only if
// the payment belongs to this order, has the right amount, and is captured.
const confirmPayment = async (booking, paymentId) => {
  if (booking.paymentStatus === "Paid") return { ok: true };

  const payment = await razorpay.fetchPayment(paymentId);

  if (
    payment.order_id !== booking.razorpayOrderId ||
    payment.currency !== "INR" ||
    payment.amount !== razorpay.toPaise(booking.price)
  ) {
    return { ok: false, reason: "The payment details do not match this booking" };
  }

  let status = payment.status;

  // "authorized" means the money is held but not collected yet, so we capture it
  if (status === "authorized") {
    const captured = await razorpay.capturePayment(paymentId, payment.amount);
    status = captured.status;
  }

  if (status !== "captured") {
    return { ok: false, reason: `The payment is ${status}, not completed` };
  }

  await markPaid(booking, paymentId);
  return { ok: true };
};

// POST /api/payments/order  (customer) - start a payment for a booking
const createOrder = async (req, res) => {
  ensureConfigured(res);

  const booking = await Booking.findById(req.body.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (!booking.customer.equals(req.user._id)) {
    res.status(403);
    throw new Error("You can only pay for your own bookings");
  }
  if (booking.paymentStatus !== "Unpaid") {
    res.status(400);
    throw new Error(
      booking.paymentStatus === "Paid"
        ? "This booking is already paid"
        : "This booking was refunded and cannot be paid again"
    );
  }
  if (!["Accepted", "Completed"].includes(booking.status)) {
    res.status(400);
    throw new Error("You can pay once the beautician has accepted your booking");
  }
  if (booking.price < MIN_RUPEES || booking.price > MAX_RUPEES) {
    res.status(400);
    throw new Error(
      `Online payment works for amounts from ₹${MIN_RUPEES} to ₹${MAX_RUPEES.toLocaleString("en-IN")}`
    );
  }

  // The amount comes from our database, never from the browser.
  // A retry reuses the same Razorpay order.
  if (!booking.razorpayOrderId) {
    let order;
    try {
      order = await razorpay.createOrder({
        amountRupees: booking.price,
        receipt: `bk_${booking._id}`,
        notes: { bookingId: String(booking._id) },
      });
    } catch (error) {
      res.status(502);
      throw new Error(`Could not start the payment: ${describeError(error)}`);
    }
    booking.razorpayOrderId = order.id;
    await booking.save();
  }

  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID, // the public key, safe for the browser
    order: {
      id: booking.razorpayOrderId,
      amount: razorpay.toPaise(booking.price),
      currency: "INR",
    },
  });
};

// POST /api/payments/verify  (customer) - called after the Razorpay window succeeds
const verifyPayment = async (req, res) => {
  ensureConfigured(res);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // We find the booking by the order id, then use the order id saved in OUR database
  const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
  if (!booking) {
    res.status(404);
    throw new Error("No booking found for this payment");
  }
  if (!booking.customer.equals(req.user._id)) {
    res.status(403);
    throw new Error("You can only verify payments for your own bookings");
  }
  if (booking.paymentStatus === "Paid") {
    return res.json({ success: true, message: "Payment already recorded", booking });
  }
  if (booking.paymentStatus !== "Unpaid") {
    res.status(400);
    throw new Error("This booking cannot be paid");
  }

  if (!paymentSignatureIsValid(booking.razorpayOrderId, razorpay_payment_id, razorpay_signature)) {
    res.status(400);
    throw new Error("Payment verification failed");
  }

  let result;
  try {
    result = await confirmPayment(booking, razorpay_payment_id);
  } catch (error) {
    res.status(502);
    throw new Error(`Could not confirm the payment: ${describeError(error)}`);
  }
  if (!result.ok) {
    res.status(400);
    throw new Error(result.reason);
  }

  res.json({ success: true, message: "Payment successful", booking });
};

// POST /api/payments/:bookingId/sync  (customer)
// For a customer who paid but closed the page before we could confirm
const syncPayment = async (req, res) => {
  ensureConfigured(res);

  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (!booking.customer.equals(req.user._id)) {
    res.status(403);
    throw new Error("You can only check your own bookings");
  }
  if (booking.paymentStatus === "Paid") {
    return res.json({ success: true, paid: true, message: "This booking is already paid", booking });
  }
  if (booking.paymentStatus !== "Unpaid" || !booking.razorpayOrderId) {
    return res.json({ success: true, paid: false, message: "No payment has been started for this booking" });
  }

  let payments;
  try {
    payments = await razorpay.fetchOrderPayments(booking.razorpayOrderId);
  } catch (error) {
    res.status(502);
    throw new Error(`Could not check the payment: ${describeError(error)}`);
  }

  const candidate = (payments.items || []).find((p) =>
    ["captured", "authorized"].includes(p.status)
  );
  if (!candidate) {
    return res.json({
      success: true,
      paid: false,
      message: "No completed payment was found yet. If you were charged, please wait a few minutes and check again.",
    });
  }

  let result;
  try {
    result = await confirmPayment(booking, candidate.id);
  } catch (error) {
    res.status(502);
    throw new Error(`Could not confirm the payment: ${describeError(error)}`);
  }
  if (!result.ok) {
    res.status(400);
    throw new Error(result.reason);
  }

  res.json({ success: true, paid: true, message: "Payment confirmed", booking });
};

// PUT /api/payments/:bookingId/cash  (beautician) - the customer paid in cash
const markCashReceived = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (!booking.beautician.equals(req.user._id)) {
    res.status(403);
    throw new Error("You can only update your own bookings");
  }
  if (booking.status !== "Completed") {
    res.status(400);
    throw new Error("You can record cash only after the appointment is completed");
  }
  if (booking.paymentStatus !== "Unpaid") {
    res.status(400);
    throw new Error("This booking is already marked as paid");
  }

  booking.paymentStatus = "Paid";
  booking.paymentMethod = "Cash";
  booking.paidAt = new Date();
  await booking.save();

  res.json({ success: true, message: "Cash payment recorded", booking });
};

// POST /api/payments/webhook  (called by Razorpay, optional)
// Needs a public https address, so it is mostly for a hosted version.
// We never trust the webhook text itself: we re-check the payment with Razorpay.
const webhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !razorpay.isConfigured()) {
    return res.status(503).json({ success: false, message: "Webhook is not configured" });
  }

  const raw = req.body; // the raw bytes, because this route uses express.raw
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqual(expected, req.headers["x-razorpay-signature"] || "")) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  // Answer quickly, then do the work (Razorpay waits only a few seconds)
  res.status(200).json({ received: true });

  try {
    const event = JSON.parse(raw.toString("utf8"));
    if (["payment.captured", "payment.authorized"].includes(event.event)) {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id) return;

      const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
      if (booking && booking.paymentStatus === "Unpaid") {
        await confirmPayment(booking, payment.id);
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", describeError(error));
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  syncPayment,
  markCashReceived,
  webhook,
};