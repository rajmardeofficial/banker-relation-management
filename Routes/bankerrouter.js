require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Banker = require("../model/bankerschema");
const { login, logout } = require("../controllers/authController");
const Lead = require("../model/leadschema");
const Service = require("../model/serviceschema");
const xlsx = require("xlsx");
const authController = require("../controllers/authController");
const forgotPassword = require("../utils/forgotpassword");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const RM = require("../model/rmschema");
const changepassword = require("../utils/changepassword");
const session = require('express-session')


//Approval Function
function checkApproval(req, res, next) {
  const { email } = req.session.user

  console.log("from checkApproval " + email);

  try {
    Banker.findOne({ email }).then((result) => {
      if (result && result.approval) {
        next();
      } else {
        res.status(403).send("You are not approved as Banker; please wait for approval");
      }
    })
  } catch (err) {
    console.error("Error while checking approval:", err);
    res.status(500).send("Internal Server Error");
  }
}

function bankerCheck(req, res, next) {
  const user = req.session.user;

  // Check if user is defined and has an 'id' property
  if (!user || !user.id) {
    return res.status(403).send("You are not a Banker or You are not logged in <a href='/banker/login'>login</a>");
  }

  try {
    Banker.findById(user.id).then((result, err) => {
      if (result) {
        // User is a banker, proceed to the next middleware
        next();
      } else {
        // User is not a banker, send a 403 Forbidden response
        res.status(403).send("You are not a Banker");
      }
    });
  } catch (e) {
    console.error("Error checking banker status:", e);
    res.status(500).send("Internal Server Error");
  }
}


// Banker Signup

router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    pan,
    password,
    accountNumber,
    ifsc,
  } = req.body;
  const saltRounds = 10;

  try {
    // Hash the password before saving it in the database
    const hash = await bcrypt.hash(password, saltRounds);

    // Check if the Banker already exists in the database
    const existingBanker = await Banker.findOne({ email });
    if (existingBanker) {
      return res.status(400).json({ message: "User already exists" });
    }

    const banker = new Banker({
      firstName,
      lastName,
      email,
      phone,
      pan,
      password: hash,
      bankDetails: {
        accountNumber: accountNumber,
        ifsc: ifsc,
      },
    });

    await banker.save();

    res.redirect("/banker/login");
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Banker Login
router.post("/login", (req, res) => {
  login(Banker, req, res, "/banker/dashboard");
});

// Function to verify JWT Token

//Create Lead

// Function to generate the leadId
// async function generateLeadId() {
//   const currentDate = new Date();
//   const day = currentDate.getDate().toString().padStart(2, "0");
//   const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
//   const year = currentDate.getFullYear().toString().substr(-2);

//   try {
//     const lastLead = await Lead.findOne({
//       generationDate: {
//         $gte: new Date(
//           currentDate.getFullYear(),
//           currentDate.getMonth(),
//           currentDate.getDate()
//         ),
//         $lt: new Date(
//           currentDate.getFullYear(),
//           currentDate.getMonth(),
//           currentDate.getDate() + 1
//         ),
//       },
//     }).sort({ leadId: -1 });

//     let sequenceNumber;

//     if (lastLead) {
//       sequenceNumber = parseInt(lastLead.leadId.slice(-5)) + 1;
//     } else {
//       sequenceNumber = 1;
//     }

//     const sequenceSuffix = sequenceNumber.toString().padStart(5, "0");
//     const leadId = `${day}${month}${year}${sequenceSuffix}`;

//     return leadId;
//   } catch (error) {
//     console.error("Error generating leadId:", error);
//     throw error;
//   }
// }

router.post("/editLead/:id/:serviceId", bankerCheck, checkApproval, async (req, res) => {
  try {
    const { firstName, lastName, phone, service, amount, remark, status } =
      req.body;
    const leadId = req.params.id;
    const serviceIdToUpdate = req.params.serviceId;

    // Get the standard fees from the Service collection
    const serviceFromDb = await Service.findOne({ serviceName: service });
    console.log("Service fetched details: " + serviceFromDb);

    // Calculate extra amount and payout amount
    const extraAmount = amount - serviceFromDb.standardFees;
    const payoutAmount = serviceFromDb.standardFees * 0.25 + extraAmount * 0.6;
    console.log("extraAmount: " + extraAmount);
    console.log("40 per of standard fees: " + serviceFromDb.standardFees * 0.25);
    console.log("60 per of extra amount: " + extraAmount * 0.6);
    console.log("payoutAmount: " + payoutAmount);

    // Update the entire Lead document
    const result = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: {
          firstName,
          lastName,
          phone,
          // Update the specific service within the services array
          "services.$[elem].serviceName": service,
          "services.$[elem].amount": amount,
          "services.$[elem].remark": remark, // You may need to adjust this part based on your requirements
          "services.$[elem].payout": payoutAmount, // You may need to adjust this part based on your requirements
          "services.$[elem].status": status, // You may need to adjust this part based on your requirements
        },
      },
      {
        arrayFilters: [{ "elem._id": serviceIdToUpdate }],
      }
    );

    // Manually recalculate and update the payoutAmount
    const updatedLead = await Lead.findById(leadId);
    const totalPayout = updatedLead.services.reduce(
      (sum, s) => sum + (s.payout || 0),
      0
    );

    // Update the payoutAmount
    updatedLead.payoutAmount = totalPayout;
    await updatedLead.save();

    res.redirect("/banker/trackLead");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// withdraw lead

router.post("/withdrawLead/:id", bankerCheck, checkApproval, (req, res) => {
  const id = req.params.id;
  Lead.findByIdAndUpdate(id, { isActive: false }).then((results, err) => {
    if (!err) {
      res.send("Lead has been withdrawed");
    } else {
      res.send(err + ": PLEASE CONTACT DEVELOPER FOR THIS ISSUE");
    }
  });
});

router.post("/createLead", bankerCheck, checkApproval, async (req, res) => {
  try {
    // Extract data from the request body
    const { firstName, lastName, phone, services } = req.body;

    // Fetch standard fees for each service from the database
    const serviceData = await Service.find({
      serviceName: { $in: services.map((service) => service.serviceName) },
    });

    // Calculate payoutAmount based on the rules
    let payoutAmount = 0;

    const updatedServices = services.map((userService) => {
      const dbService = serviceData.find(
        (s) => s.serviceName === userService.serviceName
      );

      if (!dbService) {
        return res
          .status(400)
          .json({ error: `Service not found: ${userService.serviceName}` });
      }

      const userAmount = userService.amount;
      const standardFees = dbService.standardFees;

      if (userAmount < standardFees) {
        return res.status(400).json({
          error: `Amount cannot be less than standard fees for ${userService.serviceName}`,
        });
      }

      const extraAmount = userAmount - standardFees;
      // const extraPercentage = 0.6; // 60%

      // Calculate the payout for each service
      const servicePayout =
        (standardFees + extraAmount) * 0.25 
        // (extraAmount > 0 ? extraAmount * extraPercentage : 0);

      // Add the payout for the current service to the total payout
      payoutAmount += servicePayout;
      console.log(payoutAmount);

      // Return the updated service object
      return {
        ...userService,
        payout: servicePayout,
      };
    });

    // Create a new lead
    const lead = new Lead({
      firstName,
      lastName,
      phone,
      services: updatedServices,
      payoutAmount: payoutAmount,
      banker: req.session.user.id,
      createdby: "banker",
      // Add other lead properties as needed
    });

    // Save the lead to the database
    await lead.save();

    // Find the associated Banker by their ID
    const bankerId = req.session.user.id;
    const banker = await Banker.findById(bankerId);

    if (!banker) {
      return res.status(404).json({ error: "Banker not found" });
    }

    // Push the lead's ID into the leads array of the associated Banker
    banker.leads.push(lead._id);

    // Save the updated Banker
    await banker.save();

    // Respond with success
    return res
      .status(200)
      .json({ message: "Lead created successfully", leadId: lead.leadId });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Check if person is banker

//Create Lead GET request
router.get("/createLead", bankerCheck, checkApproval, (req, res) => {
  Service.find().then((result, err) => {
    if (!err) {
      res.render("CreateLead/createlead", { result });
    } else {
      res.send(
        "Cannot render lead generation page due to some err, please contact the developer for this issue"
      );
    }
  });
});

//GET for banker dashboard

router.get("/dashboard", bankerCheck, checkApproval, (req, res) => {
  res.render("DashBoard/BankerHomeDashBoard");
});

//GET Banker Login Page
router.get("/login", (req, res) => {
  res.render("login/Login");
});

//GET Banker Signup Page
router.get("/signup", (req, res) => {
  res.render("signup/signup");
});

// GET Banker TrackEarning Page
router.get(
  "/trackearning",

  bankerCheck, checkApproval,
  async (req, res) => {
    try {
      const bankerLeads = await Banker.findById(req.session.user.id).populate(
        "leads"
      );

      console.log(bankerLeads);
      const leads = bankerLeads.leads.map((lead) => lead);

      res.render("TrackEarning/trackearning", { leads });
    } catch (error) {
      console.error("Error in trackearning route:", error);
      res.send("Internal error occurred in trackearning route");
    }
  }
);

// GET Banker TrackLead Page
router.get("/tracklead", bankerCheck, checkApproval, async (req, res) => {
  try {
    console.log(req.session.user.id);
    const bankerLeads = await Banker.findById(req.session.user.id).populate("leads");
    const leads = bankerLeads.leads.map((lead) => lead);
    res.render("TrackLead/tracklead", { leads });
  } catch (error) {
    console.error("Error in tracklead route:", error);
    res.send("Internal error occurred in tracklead route");
  }
});

router.get(
  "/editLead/:id/:serviceId",

  bankerCheck, checkApproval,
  async (req, res) => {
    try {
      const id = req.params.id;
      const serviceId = req.params.serviceId;

      // Find the lead with the specified id
      const result = await Lead.findById(id);

      if (!result) {
        return res.status(404).send("Lead not found");
      }

      // Find the service within the lead's services array based on serviceId
      const selectedService = result.services.find(
        (service) => service._id.toString() === serviceId
      );

      console.log(selectedService);

      if (!selectedService) {
        return res.status(404).send("Service not found for the specified lead");
      }

      // Fetch all services from the Service schema
      const services = await Service.find();

      // Render the EJS view with the specific lead and selected service details
      res.render("EditLead/editLead", {
        result,
        services,
        selectedService,
        user: "banker",
      });
    } catch (error) {
      // Handle errors appropriately
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Download excel sheet here
router.get("/download", bankerCheck, checkApproval, async (req, res) => {
  try {
    // Fetch leads data from the database
    const leads = await Lead.find();

    // Convert leads data to Excel format
    const formattedLeads = leads.map((lead) => ({
      ...lead.toObject(),
      generationDate: lead.generationDate.toISOString(), // Format Date to string
    }));

    const worksheet = xlsx.utils.json_to_sheet(formattedLeads);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Leads");
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Set response headers for Excel download
    res.setHeader("Content-Disposition", "attachment; filename=leads.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// LOGOUT //

router.get("/logout", (req, res) => {
  logout(req, res, "/banker/login");
});

//Forgot password

router.get("/forgotpassword", (req, res) => {
  res.render("ForgotPassword/forgotpasword", { user: "banker" });
});

//Forgot Password ba
router.post("/forgotpassword", (req, res) => {
  forgotPassword(Banker, req, res);
});

//change password
router.post("/changePassword", bankerCheck, checkApproval, (req, res) => {
  changepassword(Banker, req, res, req.session.user.id);
});

//See profile
router.get("/profile", bankerCheck, checkApproval, (req, res) => {
  Banker.findById(req.session.user.id).then((banker) => {
    RM.findById(banker.rm).then((rm) => {
      console.log(rm);
      res.render("Profile/Profile", { banker, rm });
    });
  });
});

//Edit Profile
router.get("/editProfile", bankerCheck, checkApproval, async (req, res) => {
  const id = req.session.user.id;
  const banker = await Banker.findById(id);
  console.log(banker);
  res.render("EditBankerProfile/editProfile", { banker, id });
});

//Edit Profile
router.post("/editProfile/:id", bankerCheck, checkApproval, (req, res) => {
  const id = req.params.id;
  const { firstName, lastName, email, phone, pan, accountNumber, ifsc } =
    req.body;
  console.log(req.body);
  const update = {
    firstName,
    lastName,
    email,
    phone,
    pan,
    "bankDetails.accountNumber": accountNumber,
    ifsc,
  };
  Banker.findByIdAndUpdate(id, update).then((result) =>
    res.redirect("/banker/profile")
  );
});
module.exports = router;