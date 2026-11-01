const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const models = [
  require("./models/User"),
  require("./models/Category"),
  require("./models/BeauticianProfile"),
  require("./models/Service"),
  require("./models/Availability"),
  require("./models/Booking"),
  require("./models/Review"),
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const Model of models) {
      await Model.createCollection();
      await Model.syncIndexes();
      console.log(`OK: ${Model.modelName}`);
    }
    console.log("All models loaded successfully");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();