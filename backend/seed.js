const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Category = require("./models/Category");

const categories = [
  { name: "Bridal Makeup", description: "Complete bridal makeup for your big day" },
  { name: "Party Makeup", description: "Glam looks for parties and events" },
  { name: "Hair Styling", description: "Updos, curls, braids and festive hairstyles" },
  { name: "Haircut and Hair Care", description: "Haircuts, spa, colour and treatments" },
  { name: "Facial and Skin Care", description: "Facials, cleanups and glow treatments" },
  { name: "Manicure and Pedicure", description: "Nail care and relaxing hand and foot spa" },
  { name: "Saree Draping", description: "Neat, elegant saree draping and pleating" },
  { name: "Waxing and Threading", description: "Hair removal and eyebrow shaping" },
  { name: "Mehendi", description: "Bridal and festive henna designs" },
  { name: "Basic Beauty Packages", description: "Value combos of popular services" },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Add ADMIN_EMAIL and ADMIN_PASSWORD to your .env file first");
    }

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existingAdmin) {
      console.log("Admin account already exists");
    } else {
      await User.create({
        name: ADMIN_NAME || "Site Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
      });
      console.log(`Admin account created: ${ADMIN_EMAIL}`);
    }

    for (const cat of categories) {
      await Category.updateOne(
        { name: cat.name },
        { $setOnInsert: cat },
        { upsert: true }
      );
    }
    console.log(`Categories ready: ${categories.length}`);
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();