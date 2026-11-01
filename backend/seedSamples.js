const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("./models/User");
const BeauticianProfile = require("./models/BeauticianProfile");
const Category = require("./models/Category");
const Service = require("./models/Service");
const Availability = require("./models/Availability");
const Booking = require("./models/Booking");
const Review = require("./models/Review");

// All sample accounts use this email domain, which makes them easy to find and remove
const SAMPLE_DOMAIN = "@sample.beauticianhub.example";
const SAMPLE_PASSWORD = process.env.SAMPLE_PASSWORD || "Sample@123";

// Each service: [category, title, description, price in rupees, duration in minutes]
const beauticians = [
  {
    name: "Ananya Rao",
    email: `ananya${SAMPLE_DOMAIN}`,
    phone: "9000000011",
    experience: 8,
    serviceArea: "Mysuru - Vijayanagar",
    description:
      "Bridal specialist with 8 years of experience in HD and soft-glam looks, bridal hairdos and saree draping.",
    services: [
      ["Bridal Makeup", "HD Bridal Makeup", "Long-lasting HD makeup with hair setting and touch-up kit.", 12000, 180],
      ["Bridal Makeup", "Engagement Makeup", "Soft glam look for engagement and reception.", 6000, 120],
      ["Hair Styling", "Bridal Hairdo", "Elegant bridal updo or braid with flowers and accessories.", 4000, 90],
      ["Saree Draping", "Saree Draping", "Neat pleating and pinning for any saree style.", 700, 30],
    ],
  },
  {
    name: "Divya Shetty",
    email: `divya${SAMPLE_DOMAIN}`,
    phone: "9000000012",
    experience: 6,
    serviceArea: "Mysuru - Kuvempunagar",
    description:
      "Skin care expert offering facials, cleanups and gentle waxing at your home, using products suited to your skin type.",
    services: [
      ["Facial and Skin Care", "Gold Facial", "Brightening gold facial with a relaxing face massage.", 1500, 60],
      ["Facial and Skin Care", "Deep Cleansing Cleanup", "Deep cleanup for fresh, clear skin.", 800, 45],
      ["Facial and Skin Care", "Anti-Tan Treatment", "De-tan treatment for face and neck.", 1200, 60],
      ["Waxing and Threading", "Full Arms Waxing", "Smooth full arms waxing with gentle wax.", 400, 30],
      ["Waxing and Threading", "Eyebrow and Upper Lip Threading", "Quick and precise threading.", 100, 15],
    ],
  },
  {
    name: "Kavya Gowda",
    email: `kavya${SAMPLE_DOMAIN}`,
    phone: "9000000013",
    experience: 5,
    serviceArea: "Mysuru - Saraswathipuram",
    description:
      "Hair stylist for cuts, colour, spa treatments and party hairstyles, with a calm, careful approach.",
    services: [
      ["Haircut and Hair Care", "Haircut and Blow Dry", "Haircut in your preferred style with a finishing blow dry.", 600, 45],
      ["Haircut and Hair Care", "Hair Spa", "Nourishing hair spa with a relaxing head massage.", 1500, 75],
      ["Haircut and Hair Care", "Global Hair Colour", "Full-hair colouring with a protective treatment.", 3500, 150],
      ["Hair Styling", "Party Hairstyle", "Curls, waves or an updo for parties and events.", 1200, 60],
    ],
  },
  {
    name: "Meghana Iyer",
    email: `meghana${SAMPLE_DOMAIN}`,
    phone: "9000000014",
    experience: 4,
    serviceArea: "Mysuru - Hebbal",
    description:
      "Nail care and mehendi artist, with festive and bridal designs drawn by hand.",
    services: [
      ["Manicure and Pedicure", "Classic Manicure", "Nail shaping, cuticle care and polish.", 500, 45],
      ["Manicure and Pedicure", "Spa Pedicure", "Relaxing foot soak, scrub and massage with polish.", 800, 60],
      ["Manicure and Pedicure", "Manicure and Pedicure Combo", "Complete hand and foot care in one visit.", 1200, 90],
      ["Mehendi", "Bridal Mehendi - Hands and Feet", "Detailed bridal designs for full hands and feet.", 5000, 180],
      ["Mehendi", "Festive Mehendi", "Simple, elegant designs for festivals and functions.", 800, 45],
    ],
  },
  {
    name: "Sneha Patil",
    email: `sneha${SAMPLE_DOMAIN}`,
    phone: "9000000015",
    experience: 7,
    serviceArea: "Bengaluru - Jayanagar",
    description:
      "Party makeup artist who also offers value beauty packages, perfect for a complete get-ready at home.",
    services: [
      ["Party Makeup", "Party Glam Makeup", "Glam makeup for parties, with lashes included.", 2500, 90],
      ["Party Makeup", "Cocktail Night Look", "Bold evening look with shimmer and contour.", 3500, 90],
      ["Basic Beauty Packages", "Basic Glow Package", "Cleanup, manicure and eyebrow shaping.", 2000, 120],
      ["Basic Beauty Packages", "Pamper Package", "Facial, pedicure and arms waxing in one visit.", 3500, 180],
      ["Waxing and Threading", "Full Body Waxing", "Complete body waxing with gentle wax.", 2200, 90],
    ],
  },
];

const addSamples = async () => {
  const categories = await Category.find();
  if (categories.length === 0) {
    throw new Error("No categories found. Run `node seed.js` first");
  }
  const categoryByName = {};
  categories.forEach((c) => {
    categoryByName[c.name] = c._id;
  });

  const userIds = [];

  for (const b of beauticians) {
    let user = await User.findOne({ email: b.email });
    if (!user) {
      user = await User.create({
        name: b.name,
        email: b.email,
        password: SAMPLE_PASSWORD,
        phone: b.phone,
        role: "beautician",
      });
    }
    userIds.push(user._id);

    await BeauticianProfile.updateOne(
      { user: user._id },
      {
        $setOnInsert: {
          photo: "",
          experience: b.experience,
          serviceArea: b.serviceArea,
          description: b.description,
          approvalStatus: "Approved",
          isSuspended: false,
          averageRating: 0,
          totalReviews: 0,
        },
      },
      { upsert: true }
    );

    for (const [categoryName, title, description, price, durationMinutes] of b.services) {
      const category = categoryByName[categoryName];
      if (!category) {
        console.warn(`Skipped "${title}": category "${categoryName}" not found`);
        continue;
      }
      await Service.updateOne(
        { beautician: user._id, title },
        {
          $setOnInsert: {
            category,
            description,
            price,
            durationMinutes,
            image: "",
            isActive: true,
            isSuspended: false,
          },
        },
        { upsert: true }
      );
    }

    // Working hours: Monday to Saturday, 9 AM to 6 PM
    for (let day = 1; day <= 6; day++) {
      await Availability.updateOne(
        { beautician: user._id, dayOfWeek: day },
        { $setOnInsert: { startTime: "09:00", endTime: "18:00", isActive: true } },
        { upsert: true }
      );
    }
  }

  const serviceCount = await Service.countDocuments({ beautician: { $in: userIds } });
  console.log(`Sample beauticians ready: ${userIds.length}`);
  console.log(`Sample services ready: ${serviceCount}`);
  console.log(`Sample login password: ${SAMPLE_PASSWORD}`);
};

const removeSamples = async () => {
  const users = await User.find({ email: { $regex: "@sample\\.beauticianhub\\.example$" } });
  const ids = users.map((u) => u._id);

  if (ids.length === 0) {
    console.log("No sample data found");
    return;
  }

  await Review.deleteMany({ beautician: { $in: ids } });
  await Booking.deleteMany({ beautician: { $in: ids } });
  await Service.deleteMany({ beautician: { $in: ids } });
  await Availability.deleteMany({ beautician: { $in: ids } });
  await BeauticianProfile.deleteMany({ user: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });

  console.log(`Removed ${ids.length} sample beauticians and everything linked to them`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.argv.includes("--remove")) {
      await removeSamples();
    } else {
      await addSamples();
    }
  } catch (error) {
    console.error("Sample data error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();