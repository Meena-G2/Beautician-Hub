const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Load the values from the .env file FIRST
dotenv.config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const beauticianRoutes = require("./routes/beauticianRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { webhook: paymentWebhook } = require("./controllers/paymentController");

// Connect to MongoDB
connectDB();

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// The payment webhook needs the RAW request body, so it comes BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentWebhook);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "100kb" }));

// Rate limits (they slow down password guessing and message spam)
const makeLimiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

const authLimiter = makeLimiter(15, 100, "Too many attempts. Please try again in a few minutes.");
const contactLimiter = makeLimiter(60, 10, "Too many messages sent. Please try again later.");

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.post("/api/contact", contactLimiter);

// Test routes
app.get("/", (req, res) => {
  res.json({ message: "Beautician Hub API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "OK" });
});

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/beauticians", beauticianRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling (must stay at the bottom)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});