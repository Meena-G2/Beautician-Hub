const BeauticianProfile = require("../models/BeauticianProfile");
const User = require("../models/User");
const Service = require("../models/Service");
const Review = require("../models/Review");

// Makes user text safe to use inside a search pattern
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/beauticians  (public)
// Search by ?name= ?service= ?location= ?category= ?minPrice= ?maxPrice= ?sort=
const getBeauticians = async (req, res) => {
  const { name, service, location, category, minPrice, maxPrice, sort } = req.query;

  const filter = { approvalStatus: "Approved", isSuspended: false };

  if (location) {
    filter.serviceArea = { $regex: escapeRegex(location), $options: "i" };
  }

  // Each search narrows down the list of allowed beautician user ids
  let allowedIds = null;
  const restrictTo = (ids) => {
    allowedIds = allowedIds === null ? ids : allowedIds.filter((id) => ids.includes(id));
  };

  if (name) {
    const users = await User.find({
      name: { $regex: escapeRegex(name), $options: "i" },
      role: "beautician",
      status: "active",
    }).select("_id");
    restrictTo(users.map((u) => u._id.toString()));
  }

  if (service || category || minPrice || maxPrice) {
    const serviceFilter = { isActive: true, isSuspended: false };
    if (service) serviceFilter.title = { $regex: escapeRegex(service), $options: "i" };
    if (category) serviceFilter.category = category;
    if (minPrice || maxPrice) {
      serviceFilter.price = {};
      if (minPrice) serviceFilter.price.$gte = Number(minPrice);
      if (maxPrice) serviceFilter.price.$lte = Number(maxPrice);
    }
    const ids = await Service.distinct("beautician", serviceFilter);
    restrictTo(ids.map((id) => id.toString()));
  }

  if (allowedIds !== null) filter.user = { $in: allowedIds };

  let sortBy = "-averageRating";
  if (sort === "experience") sortBy = "-experience";
  if (sort === "newest") sortBy = "-createdAt";

  let profiles = await BeauticianProfile.find(filter)
    .populate("user", "name status")
    .sort(sortBy)
    .lean();

  // Hide beauticians whose account was suspended
  profiles = profiles.filter((p) => p.user && p.user.status === "active");

  // Add starting price and a few service names to each card
  const userIds = profiles.map((p) => p.user._id);
  const services = await Service.find({
    beautician: { $in: userIds },
    isActive: true,
    isSuspended: false,
  })
    .select("beautician title price")
    .lean();

  const beauticians = profiles.map((p) => {
    const mine = services.filter(
      (s) => s.beautician.toString() === p.user._id.toString()
    );
    return {
      ...p,
      startingPrice: mine.length ? Math.min(...mine.map((s) => s.price)) : null,
      serviceCount: mine.length,
      serviceTitles: mine.slice(0, 3).map((s) => s.title),
    };
  });

  res.json({ success: true, count: beauticians.length, beauticians });
};

// GET /api/beauticians/:userId  (public) - full public profile
const getBeauticianById = async (req, res) => {
  const profile = await BeauticianProfile.findOne({
    user: req.params.userId,
    approvalStatus: "Approved",
    isSuspended: false,
  })
    .populate("user", "name status")
    .lean();

  if (!profile || profile.user.status !== "active") {
    res.status(404);
    throw new Error("Beautician not found");
  }

  const services = await Service.find({
    beautician: req.params.userId,
    isActive: true,
    isSuspended: false,
  }).populate("category", "name");

  const reviews = await Review.find({ beautician: req.params.userId })
    .populate("customer", "name")
    .sort("-createdAt")
    .limit(20);

  res.json({ success: true, beautician: profile, services, reviews });
};

// GET /api/beauticians/me/profile  (beautician) - my own profile
const getMyProfile = async (req, res) => {
  const profile = await BeauticianProfile.findOne({ user: req.user._id });
  // profile is null until the beautician creates one
  res.json({ success: true, profile });
};

// PUT /api/beauticians/me/profile  (beautician) - create or update my profile
const saveMyProfile = async (req, res) => {
  const { photo, experience, serviceArea, description } = req.body;

  let profile = await BeauticianProfile.findOne({ user: req.user._id });

  if (!profile) {
    profile = await BeauticianProfile.create({
      user: req.user._id,
      photo,
      experience,
      serviceArea,
      description,
    });
    return res.status(201).json({
      success: true,
      message: "Profile created and sent for admin approval",
      profile,
    });
  }

  if (photo !== undefined) profile.photo = photo;
  if (experience !== undefined) profile.experience = experience;
  if (serviceArea !== undefined) profile.serviceArea = serviceArea;
  if (description !== undefined) profile.description = description;

  // A rejected profile goes back for review after the beautician fixes it
  if (profile.approvalStatus === "Rejected") profile.approvalStatus = "Pending";

  await profile.save();
  res.json({ success: true, message: "Profile updated", profile });
};

// GET /api/beauticians/admin/all  (admin) - ?status=Pending|Approved|Rejected
const getAllProfilesAdmin = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.approvalStatus = req.query.status;

  const profiles = await BeauticianProfile.find(filter)
    .populate("user", "name email phone status")
    .sort("-createdAt");

  res.json({ success: true, count: profiles.length, profiles });
};

// PUT /api/beauticians/:userId/approval  (admin)
const setApprovalStatus = async (req, res) => {
  const profile = await BeauticianProfile.findOne({ user: req.params.userId });
  if (!profile) {
    res.status(404);
    throw new Error("Beautician profile not found");
  }

  profile.approvalStatus = req.body.status;
  await profile.save();

  res.json({
    success: true,
    message: `Profile ${req.body.status.toLowerCase()}`,
    profile,
  });
};

module.exports = {
  getBeauticians,
  getBeauticianById,
  getMyProfile,
  saveMyProfile,
  getAllProfilesAdmin,
  setApprovalStatus,
};