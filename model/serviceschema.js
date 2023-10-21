const mongoose = require("mongoose");
const Schema = mongoose.Schema({
  serviceName: { type: String, required: true },
  standardFees: {
    type: Number,
    required: true,
  },
});

const Service = mongoose.model("Service", Schema);
module.exports = Service;
