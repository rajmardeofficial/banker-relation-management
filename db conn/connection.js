require('dotenv').config();
const mongoose = require("mongoose");

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Db Connected Successfully");
  } catch (error) {
    console.error(error);
  }
}

connectToDatabase();
