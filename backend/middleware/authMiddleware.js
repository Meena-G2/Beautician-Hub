const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Checks that the request has a valid login token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not logged in. Please log in to continue");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token. Please log in again");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error("The account for this token no longer exists");
  }

  if (user.status === "suspended") {
    res.status(403);
    throw new Error("Your account has been suspended. Please contact support");
  }

  req.user = user; // available in every controller after this
  next();
};

module.exports = { protect };