const express = require("express");
const { login, logout } = require("../controllers/authController");
const RM = require("../model/rmschema");
const Service = require("../model/serviceschema");
const Banker = require("../model/bankerschema");
const Lead = require("../model/leadschema");
const router = express.Router();
const jwt = require("jsonwebtoken");
const forgotPassword = require("../utils/forgotpassword");
const mongoose = require("mongoose");
const session = require('express-session')


//Function to check RM

function rmCheck(req, res, next) {
  const user = req.session.user;
  if (!user) {
    return res.status(403).send("Unauthorized: User not logged in");
  }

  try {
    RM.findById(user.id).then((result, err) => {
      if (result) {
        // User is an admin, proceed to the next middleware
        // console.log("from admincheck " + result);
        next();
      } else {
        // User is not an admin, send a 403 Forbidden response
        res.status(403).send("You are not an Relation Manager");
      }
    })
  } catch (e) {
    console.error("Error checking admin status:", e);
    res.status(500).send("Internal Server Error");
  }
}


//Generate Id
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

//Rm can do all the things that banker can inititate
// Create Lead, Track Lead,

//Login

router.post("/login", (req, res) => {
  login(RM, req, res, "/rm/dashboard");
});

//Create Lead on behalf of Banker
router.post("/createLead", rmCheck,  async (req, res) => {
  try {
    // Extract data from the request body
    const { firstName, lastName, phone, services, bankersId, paymentStatus } = req.body;


    // Check if the 'services' array is present
    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: "Services array is required" });
    }

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
      payoutAmount,
      createdby: "rm",
      banker: bankersId
      // Add other lead properties as needed
    });

    // Save the lead to the database
    await lead.save();

    // Find the associated Banker by their ID
    const bankerId = bankersId;
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

//Edit Lead

router.post("/editLead/:id/:serviceId",rmCheck, async (req, res) => {
  try {
    const { firstName, lastName, phone, service, amount, remark, status, paymentStatus } =
      req.body;
    const leadId = req.params.id;
    const serviceIdToUpdate = req.params.serviceId;

    // Get the standard fees from the Service collection
    const serviceFromDb = await Service.findOne({ serviceName: service });

    // Calculate extra amount and payout amount
    const extraAmount = amount - serviceFromDb.standardFees;
    // const payoutAmount = serviceFromDb.standardFees * 0.4 + extraAmount * 0.6;
    const payoutAmount = (serviceFromDb.standardFees + extraAmount) * 0.25;
    // console.log("extraAmount: " + extraAmount);
    // console.log("40 per of standard fees: " + serviceFromDb.standardFees * 0.4);
    // console.log("60 per of extra amount: " + extraAmount * 0.6);
    // console.log("payoutAmount: " + payoutAmount);

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
          "services.$[elem].paymentStatus": paymentStatus, // You may need to adjust this part based on your requirements
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

    res.redirect("/rm/trackLead");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// withdraw lead

router.get("/withdrawLead/:id/:serviceId",rmCheck, async (req, res) => {
  const leadId = req.params.id;
  const serviceId = req.params.serviceId;

  try {
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).send("Lead not found");
    }

    // Find the service by ID in the lead's services array
    const serviceToUpdate = lead.services.find(service => service._id.toString() === serviceId);

    if (!serviceToUpdate) {
      return res.status(404).send("Service not found");
    }

    // Update the isActive property for the specific service
    serviceToUpdate.isActive = false;

    // Save the updated lead document
    await lead.save();

    res.send("Lead has been withdrawn for the specific service");
  } catch (error) {
    console.error("Error withdrawing lead:", error);
    res.status(500).send("Internal Server Error");
  }
});


// GET create Lead

router.get("/createLead",  rmCheck, (req, res) => {
  try {
    Banker.find({ rm: req.session.user.id }).then((banker) => {
      console.log(banker);
      Service.find().then((result, err) => {
        if (!err) {
          res.render("CreateLeadRM/createlead", { result, banker });
        } else {
          res.send(
            "Cannot render lead generation page due to some err, please contact the developer for this issue"
          );
        }
      });
    });
  } catch (e) {
    res.send("PLEASE CONTACT DEVELOPER FOR THIS ERROR");
  }
});

// Helper function to convert bankers object to array
router.get("/trackLead",  rmCheck, async (req, res) => {
  try {
    const rmObjectId = new mongoose.Types.ObjectId(req.session.user.id);

    const result = await RM.aggregate([
      { $match: { _id: rmObjectId } },
      {
        $lookup: {
          from: "bankers",
          localField: "_id",
          foreignField: "rm",
          as: "bankers"
        }
      },
      {
        $lookup: {
          from: "leads",
          localField: "bankers.leads",
          foreignField: "_id",
          as: "leads"
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          bankers: {
            $map: {
              input: "$bankers",
              as: "banker",
              in: {
                _id: "$$banker._id",
                firstName: "$$banker.firstName",
                lastName: "$$banker.lastName",
                leads: {
                  $filter: {
                    input: "$leads",
                    as: "lead",
                    cond: {
                      $in: ["$$lead._id", "$$banker.leads"]
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    if (result.length === 0) {
      console.error("RM not found");
      return res.status(404).send("Leads not found");
    }

    // Extract the leads array from the result
    // const leads = result[0].leads[0]; // Assuming there's only one RM

    // res.json(result);

    res.render("TrackLeadRM/tracklead", {
      result,
      user: "banker",
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});



//Edit Lead

router.get("/editLead/:id/:serviceId",rmCheck, async (req, res) => {
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

    // console.log(selectedService);

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
      user: "rm",
    });
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Login GET

router.get("/login", (req, res) => {
  res.render("loginRM/Login");
});

//Dashboard Get

router.get("/dashboard",rmCheck, (req, res) => {
  res.render("DashboardRM/dashboard");
});

// LOGOUT //

router.get("/logout",rmCheck, (req, res) => {
  logout(req, res, "/rm/login");
});

//Forgot password

router.get("/forgotpassword", (req, res) => {
  res.render("ForgotPassword/forgotpasword", { user: "rm" });
});

router.post("/forgotpassword", (req, res) => {
  forgotPassword(RM, req, res);
});

module.exports = router;