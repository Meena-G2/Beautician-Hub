// Usage: authorize("admin") or authorize("beautician", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("You do not have permission to access this resource");
    }
    next();
  };
};

module.exports = { authorize };