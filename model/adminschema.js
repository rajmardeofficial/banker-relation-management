const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  name: {
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
  approval: {
    type: Boolean,
    default: false,
  },
});

const Admin = mongoose.model("Admin", Schema);
module.exports = Admin;
