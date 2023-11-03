const mongoose = require("mongoose");
const crypto = require('crypto')

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
  pan: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  rm: {
    type: mongoose.Types.ObjectId,
    ref: "RelationManager",
  },
  leads: [
    { type: mongoose.Types.ObjectId, ref: "Lead" },
  ],
  approval: {
    type: Boolean,
    default: false,
  },
  bankDetails: {
    accountNumber: { type: Number, required: true },
    ifsc: { type: String, required: true },
  },
  bankerId: {
    type: String,
    default: function () {
      return crypto.randomUUID();
    },
    required: true,
  },
});

const Banker = mongoose.model("Banker", Schema);
module.exports = Banker;
