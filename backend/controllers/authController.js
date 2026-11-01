const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// The user details we are happy to send to the frontend (never the password)
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  address: user.address,
  status: user.status,
});

// POST /api/auth/register   (public)
const register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || "customer",
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token: generateToken(user._id),
    user: userResponse(user),
  });
};

// POST /api/auth/login   (public)
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.status === "suspended") {
    res.status(403);
    throw new Error("Your account has been suspended. Please contact support");
  }

  res.json({
    success: true,
    message: "Login successful",
    token: generateToken(user._id),
    user: userResponse(user),
  });
};

// GET /api/auth/me   (logged-in users)
const getMe = async (req, res) => {
  res.json({ success: true, user: userResponse(req.user) });
};

// PUT /api/auth/me   (logged-in users) - update own profile
const updateMe = async (req, res) => {
  const updates = {};

  ["name", "phone"].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.address) {
    ["street", "city", "state", "pincode"].forEach((key) => {
      if (req.body.address[key] !== undefined) {
        updates[`address.${key}`] = req.body.address[key];
      }
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Profile updated",
    user: userResponse(user),
  });
};

module.exports = { register, login, getMe, updateMe };