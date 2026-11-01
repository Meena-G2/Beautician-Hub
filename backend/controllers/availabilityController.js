const mongoose = require("mongoose");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const BeauticianProfile = require("../models/BeauticianProfile");

const SLOT_STEP = 30; // minutes between possible start times
const MIN_LEAD_MINUTES = 60; // a booking must start at least this far from now
const MAX_ADVANCE_DAYS = 90; // how far ahead customers can book

// "14:30" -> 870
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// 870 -> "14:30"
const toTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

// Checks "2026-11-15" is a real calendar date
const isValidDate = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
};

// 0 = Sunday ... 6 = Saturday
const getDayOfWeek = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

const daysBetween = (from, to) => {
  const a = from.split("-").map(Number);
  const b = to.split("-").map(Number);
  return (Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000;
};

// Current date and time in India, whatever timezone the server uses
const getNowIST = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

// The main rule: which start times are free for this beautician on this date?
const getAvailableSlots = async (beauticianId, date, durationMinutes) => {
  const now = getNowIST();

  if (date < now.date) return [];
  if (daysBetween(now.date, date) > MAX_ADVANCE_DAYS) return [];

  const availability = await Availability.findOne({
    beautician: beauticianId,
    dayOfWeek: getDayOfWeek(date),
    isActive: true,
  });
  if (!availability) return [];

  const booked = await Booking.find({
    beautician: beauticianId,
    date,
    status: { $in: ["Pending", "Accepted"] },
  }).select("startTime endTime");

  const windowStart = toMinutes(availability.startTime);
  const windowEnd = toMinutes(availability.endTime);
  const slots = [];

  for (let start = windowStart; start + durationMinutes <= windowEnd; start += SLOT_STEP) {
    const end = start + durationMinutes;

    // skip times that are too soon (only matters for today)
    if (date === now.date && start < now.minutes + MIN_LEAD_MINUTES) continue;

    // skip times that overlap an existing booking
    const clash = booked.some(
      (b) => start < toMinutes(b.endTime) && end > toMinutes(b.startTime)
    );
    if (!clash) slots.push(toTime(start));
  }

  return slots;
};

// GET /api/availability/me  (beautician)
const getMyAvailability = async (req, res) => {
  const schedule = await Availability.find({ beautician: req.user._id }).sort("dayOfWeek");
  res.json({ success: true, schedule });
};

// PUT /api/availability/me  (beautician) - save my whole weekly schedule
const saveMyAvailability = async (req, res) => {
  const { schedule } = req.body;

  const days = schedule.map((s) => s.dayOfWeek);
  if (new Set(days).size !== days.length) {
    res.status(400);
    throw new Error("Each weekday can appear only once");
  }

  for (const s of schedule) {
    if (toMinutes(s.startTime) >= toMinutes(s.endTime)) {
      res.status(400);
      throw new Error("End time must be after start time");
    }
  }

  // Remove days that are no longer in the schedule, then add or update the rest
  await Availability.deleteMany({
    beautician: req.user._id,
    dayOfWeek: { $nin: days },
  });

  for (const s of schedule) {
    await Availability.findOneAndUpdate(
      { beautician: req.user._id, dayOfWeek: s.dayOfWeek },
      {
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive !== false,
      },
      { upsert: true, runValidators: true }
    );
  }

  const saved = await Availability.find({ beautician: req.user._id }).sort("dayOfWeek");
  res.json({ success: true, message: "Availability saved", schedule: saved });
};

// GET /api/availability/:beauticianId/slots?date=2026-11-15&serviceId=...  (public)
const getSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  const { beauticianId } = req.params;

  if (!date || !isValidDate(date)) {
    res.status(400);
    throw new Error("Please give a valid date like 2026-11-15");
  }
  if (!serviceId || !mongoose.isValidObjectId(serviceId)) {
    res.status(400);
    throw new Error("A valid serviceId is required");
  }

  const service = await Service.findOne({
    _id: serviceId,
    beautician: beauticianId,
    isActive: true,
    isSuspended: false,
  });
  if (!service) {
    res.status(404);
    throw new Error("Service not found for this beautician");
  }

  const profile = await BeauticianProfile.findOne({
    user: beauticianId,
    approvalStatus: "Approved",
    isSuspended: false,
  });
  if (!profile) {
    res.status(404);
    throw new Error("Beautician not found");
  }

  const slots = await getAvailableSlots(beauticianId, date, service.durationMinutes);

  res.json({
    success: true,
    date,
    durationMinutes: service.durationMinutes,
    slots,
  });
};

module.exports = {
  getMyAvailability,
  saveMyAvailability,
  getSlots,
  getAvailableSlots,
  isValidDate,
  toMinutes,
  toTime,
};