const Razorpay = require("razorpay");

let client = null;

const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getClient = () => {
  if (!isConfigured()) {
    throw new Error("Online payments are not configured on this server");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

// Razorpay wants amounts in paise: ₹500 -> 50000
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

const createOrder = ({ amountRupees, receipt, notes }) =>
  getClient().orders.create({
    amount: toPaise(amountRupees),
    currency: "INR",
    receipt,
    notes,
  });

const fetchPayment = (paymentId) => getClient().payments.fetch(paymentId);

const fetchOrderPayments = (orderId) => getClient().orders.fetchPayments(orderId);

const capturePayment = (paymentId, amountPaise) =>
  getClient().payments.capture(paymentId, amountPaise, "INR");

const refundPayment = (paymentId, amountRupees) =>
  getClient().payments.refund(paymentId, {
    amount: toPaise(amountRupees),
    speed: "normal",
  });

module.exports = {
  isConfigured,
  toPaise,
  createOrder,
  fetchPayment,
  fetchOrderPayments,
  capturePayment,
  refundPayment,
};