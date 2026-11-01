const Service = require("../models/Service");
const Category = require("../models/Category");
const BeauticianProfile = require("../models/BeauticianProfile");
const Booking = require("../models/Booking");

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Is this service owned by the logged-in user?
const isOwner = (service, user) =>
  service.beautician.toString() === user._id.toString();

// GET /api/services  (public)
// ?category= ?search= ?minPrice= ?maxPrice= ?beautician= ?sort=price_asc|price_desc|newest
const getServices = async (req, res) => {
  const { category, search, minPrice, maxPrice, beautician, sort } = req.query;

  // Only show services of approved, non-suspended beauticians
  const approved = await BeauticianProfile.find({
    approvalStatus: "Approved",
    isSuspended: false,
  }).select("user");
  const approvedIds = approved.map((p) => p.user);

  const filter = { isActive: true, isSuspended: false };
  const conditions = [{ beautician: { $in: approvedIds } }];
  if (beautician) conditions.push({ beautician });
  filter.$and = conditions;

  if (category) filter.category = category;
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortBy = "-createdAt";
  if (sort === "price_asc") sortBy = "price";
  if (sort === "price_desc") sortBy = "-price";

  const services = await Service.find(filter)
    .populate("category", "name image")
    .populate("beautician", "name")
    .sort(sortBy)
    .lean();

  // Attach the beautician's profile details (photo, rating, area) to each service
  const profiles = await BeauticianProfile.find({
    user: { $in: services.map((s) => s.beautician._id) },
  })
    .select("user photo averageRating totalReviews serviceArea experience")
    .lean();

  const profileByUser = {};
  profiles.forEach((p) => {
    profileByUser[p.user.toString()] = p;
  });

  const result = services.map((s) => ({
    ...s,
    beauticianProfile: profileByUser[s.beautician._id.toString()] || null,
  }));

  res.json({ success: true, count: result.length, services: result });
};

// GET /api/services/mine  (beautician) - all of my services
const getMyServices = async (req, res) => {
  const services = await Service.find({ beautician: req.user._id })
    .populate("category", "name")
    .sort("-createdAt");

  res.json({ success: true, count: services.length, services });
};

// GET /api/services/:id  (public)
const getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate("category", "name image")
    .populate("beautician", "name");

  const profile = service
    ? await BeauticianProfile.findOne({ user: service.beautician._id })
    : null;

  const visible =
    service &&
    service.isActive &&
    !service.isSuspended &&
    profile &&
    profile.approvalStatus === "Approved" &&
    !profile.isSuspended;

  if (!visible) {
    res.status(404);
    throw new Error("Service not found");
  }

  res.json({ success: true, service, beauticianProfile: profile });
};

// POST /api/services  (beautician)
const createService = async (req, res) => {
  const { category, title, description, price, durationMinutes, image } = req.body;

  const profile = await BeauticianProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(400);
    throw new Error("Create your professional profile before adding services");
  }

  const cat = await Category.findById(category);
  if (!cat || !cat.isActive) {
    res.status(400);
    throw new Error("Please choose a valid category");
  }

  const service = await Service.create({
    beautician: req.user._id, // always the logged-in user, never taken from the request body
    category,
    title,
    description,
    price,
    durationMinutes,
    image,
  });

  res.status(201).json({ success: true, message: "Service added", service });
};

// PUT /api/services/:id  (beautician - owner only)
const updateService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  if (!isOwner(service, req.user)) {
    res.status(403);
    throw new Error("You can only edit your own services");
  }

  if (req.body.category !== undefined) {
    const cat = await Category.findById(req.body.category);
    if (!cat || !cat.isActive) {
      res.status(400);
      throw new Error("Please choose a valid category");
    }
  }

  // Only these fields can be changed (not beautician, not isSuspended)
  ["category", "title", "description", "price", "durationMinutes", "image", "isActive"].forEach(
    (field) => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    }
  );

  await service.save();
  res.json({ success: true, message: "Service updated", service });
};

// DELETE /api/services/:id  (beautician - owner, or admin)
const deleteService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  if (req.user.role !== "admin" && !isOwner(service, req.user)) {
    res.status(403);
    throw new Error("You can only delete your own services");
  }

  const activeBookings = await Booking.countDocuments({
    service: service._id,
    status: { $in: ["Pending", "Accepted"] },
  });
  if (activeBookings > 0) {
    res.status(400);
    throw new Error(
      "This service has pending or accepted bookings. Deactivate it instead of deleting"
    );
  }

  await service.deleteOne();
  res.json({ success: true, message: "Service deleted" });
};

// PUT /api/services/:id/suspend  (admin)
const suspendService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  service.isSuspended = req.body.isSuspended;
  await service.save();

  res.json({
    success: true,
    message: service.isSuspended ? "Service suspended" : "Service restored",
    service,
  });
};

module.exports = {
  getServices,
  getMyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  suspendService,
};