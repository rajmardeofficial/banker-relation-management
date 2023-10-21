const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  Bankers: [
    {
      banker: { type: mongoose.Types.ObjectId, ref: "Banker", required: true },
    },
  ],
});

const RM = mongoose.model("RelationManager", Schema);
module.exports = RM;
