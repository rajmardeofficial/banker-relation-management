const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeadCounter = mongoose.model(
  "LeadCounter",
  new mongoose.Schema({
    sequenceNumber: {
      type: Number,
      default: 1,
    },
  })
);

async function generateLeadId() {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, "0");
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const year = currentDate.getFullYear().toString().substr(-2);

  // Find the LeadCounter document and update the sequence number
  const leadCounter = await LeadCounter.findOneAndUpdate(
    {},
    { $inc: { sequenceNumber: 1 } },
    {
      upsert: true,
      new: true,
    }
  );

  // Generate the leadId with a continuous sequence number
  const leadId = `${day}${month}${year}${leadCounter.sequenceNumber
    .toString()
    .padStart(6, "0")}`;

  return leadId;
}

const leadSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  generationDate: {
    type: Date,
    default: new Date(),
  },
  services: [
    {
      serviceName: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      remark: {
        type: String,
      },
      payout: {
        type: Number,
      },
      status: {
        type: String,
        required: true,
        default: "Pending",
      },
      paymentStatus: {
        type: Boolean,
        default: false,
      },
      isActive: {
        type: Boolean,
        default: true,
      }
    },
  ],


  banker: { type: mongoose.Types.ObjectId, ref: "Banker" },

  phone: {
    type: Number,
    required: true,
  },

  payoutAmount: {
    type: Number,
    required: true,
  },
  bonusAmount: {
    type: Number,
    default: 0,
  },


  leadId: {
    type: String,
    default: null,
    unique: true,
  },
  createdby: {
    type: String,
    required: true
  },
});

// Use a pre-save hook to generate leadId and calculate payoutAmount before saving
leadSchema.pre("save", async function (next) {
  try {
    if (!this.leadId) {
      // Generate leadId only if it doesn't exist
      this.leadId = await generateLeadId();
    }

    // Calculate the sum of payouts under services
    const totalPayout = this.services.reduce(
      (sum, service) => sum + (service.payout || 0),
      0
    );
    this.payoutAmount = totalPayout;

    next();
  } catch (error) {
    console.error("Error generating leadId:", error);
    next(error);
  }
});

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;
