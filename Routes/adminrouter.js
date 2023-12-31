require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Admin = require("../model/adminschema");
const RM = require("../model/rmschema");
const Service = require("../model/serviceschema");
const forgotPassword = require("../utils/forgotpassword");
const changepassword = require("../utils/changepassword");
const { ObjectId } = require("mongodb");
const { login, signup, setupSession } = require("../controllers/authController");
const Banker = require("../model/bankerschema");
const Lead = require("../model/leadschema");
const xlsx = require("xlsx");
const session = require('express-session')

// Check if person is admin

function adminCheck(req, res, next) {
  const user = req.session.user;

  // console.log(user);

  if (!user) {
    return res.status(403).send("Unauthorized: User not logged in");
  }

  try {
    Admin.findById(user.id).then((result, err) => {
      if (result) {
        // User is an admin, proceed to the next middleware
        // console.log("from admincheck " + result);
        next();
      } else {
        // User is not an admin, send a 403 Forbidden response
        res.status(403).send("You are not an admin");
      }
    })
  } catch (e) {
    console.error("Error checking admin status:", e);
    res.status(500).send("Internal Server Error");
  }
}

//Check for approval function
function checkApproval(req, res, next) {
  const email = req.session.user.email;

  console.log(email);

  try {
    Admin.findOne({ email }).then((result) => {
      if (result && result.approval) {
        next();
      } else {
        res.status(403).send("You are not approved as admin; please wait for approval");
      }
    })
  } catch (err) {
    console.error("Error while checking approval:", err);
    res.status(500).send("Internal Server Error");
  }
}
// POST route to handle admin approval
router.post(
  "/approveAdmin",
  adminCheck, checkApproval,
  async (req, res) => {
    const { adminId, action } = req.body;

    try {
      // Find the admin by ID
      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Update the approval status based on the action
      if (action === "approve") {
        admin.approval = true;
      } else if (action === "reject") {
        // Optionally handle rejection logic, e.g., remove the admin from the database
        await Admin.findByIdAndDelete(adminId);
        return res.json({ message: "Admin rejected and removed" });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

      // Save the changes
      await admin.save();

      // Respond with a success message
      res.json({ message: "Action successful", admin });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// POST route to handle banker approval
router.post(
  "/approveBanker",
  adminCheck, checkApproval,
  async (req, res) => {
    const { bankerId, action } = req.body;

    try {
      // Find the admin by ID
      const banker = await Banker.findById(bankerId);

      if (!banker) {
        return res.status(404).json({ error: "Banker not found" });
      }

      // Update the approval status based on the action
      if (action === "approve") {
        banker.approval = true;
      } else if (action === "reject") {
        // Optionally handle rejection logic, e.g., remove the banker from the database
        await Admin.findByIdAndDelete(bankerId);
        return res.json({ message: "Banker rejected and removed" });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

      // Save the changes
      await banker.save();

      // Respond with a success message
      res.json({ message: "Action successful", banker });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//Admin Signup Post Request
router.post("/signup", (req, res) => {
  signup(Admin, req, res);
});

// Admin Login post request

router.post("/login", (req, res) => {
  login(Admin, req, res, "/admin");
});

// Signup

router.get("/signup", (req, res) => {
  res.render("signupAdmin/signup");
});

// Add relationship manager

router.post("/addrm", adminCheck, checkApproval, async (req, res) => {
  const { fname, lname, phone, email, password } = req.body;
  const saltRounds = 10;

  try {
    // Hash the password before saving it in the database
    const hash = await bcrypt.hash(password, saltRounds);

    // Create a new RM instance
    const rm = new RM();
    rm.firstName = fname;
    rm.lastName = lname;
    rm.phone = phone;
    rm.email = email;
    rm.password = hash; // Save the hashed password

    // Find if RM already exists with the email
    const filter = {
      email: email,
    };
    const existingRM = await RM.findOne(filter);

    if (existingRM) {
      return res.send("<h2>Relation Manager Already Exists</h2>");
    }

    // Save the new RM in the database
    await rm.save();

    // Redirect or send a response as needed
    res.redirect("/admin");
  } catch (error) {
    console.error("Error during addrm:", error);
    res.status(500).send("Internal server error");
  }
});

// Update relationship manager

router.post("/updatemanager", adminCheck, checkApproval, (req, res) => {
  try {
    const { firstName, lastName, email, password, rmid } = req.body;

    const saltRounds = 10;

    bcrypt.hash(password, saltRounds).then((hash) => {

      const updates = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hash,
      };

      RM.findByIdAndUpdate(rmid, updates).then((results) => {
        res.redirect("/admin");
      });
    })


  } catch (e) {
    res.send("Some error occured :" + e);
  }
});

// Admin can add services

router.post("/addservice", adminCheck, checkApproval, (req, res) => {
  const { serviceName, standardFees } = req.body;
  const service = new Service();
  service.serviceName = serviceName;
  service.standardFees = standardFees;

  // check if service already exists

  async function findExistingService() {
    try {
      const filter = {
        serviceName: serviceName,
      };
      const result = await Service.findOne(filter);
      if (result) {
        res.send("<h2>Service already exists</h2>");
      } else {
        service.save().then((results) => {
          res.send("<h2>data saved: Service added</h2>");
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
  findExistingService();
});

//Update the services

router.post("/updateservice", adminCheck, checkApproval, (req, res) => {
  const { serviceId, updatedServiceName, standardFees } = req.body;

  const updates = {
    serviceName: updatedServiceName,
    standardFees: standardFees,
  };

  try {
    Service.findByIdAndUpdate(serviceId, updates, { new: true })
      .then((updatedService) => {
        res.send(updatedService);
      })
      .catch((error) => {
        // Handle errors
        res.status(500).send(error.message);
      });
  } catch (e) {
    res.send("CONTACT THE DEVELOPER FOR THIS ERROR: " + e);
  }
});

//Forgot Password Admin
router.post("/forgotpassword", (req, res) => {
  forgotPassword(Admin, req, res);
});

// Change password Admin
router.post("/changePassword", adminCheck, checkApproval, (req, res) => {
  changepassword(Admin, req, res, req.session.user.id);
});

//Update RM for Banker and vice versa
router.post("/appointRm", adminCheck, checkApproval, (req, res) => {
  const { relationManager, banker } = req.body;
  try {
    Banker.findByIdAndUpdate(banker, { rm: relationManager }).then(
      (results) => {
        res.send("<h2>RM has be appointed</h2>");
      }
    );

    // Here Admin add or push the Bankers list of RM
    RM.findByIdAndUpdate(relationManager, {
      $push: {
        Bankers: {
          banker: banker,
        },
      },
    }).then((results) => {
      console.log("Banker added to RM");
    });
  } catch (e) {
    res.send("Some error occured: " + e);
  }
});

//Get Request for Login
router.get("/login", (req, res) => {
  res.render("AdminLogin/Login");
});

// Get request for admin dashboard page
router.get("/", adminCheck, checkApproval, async (req, res) => {
  try {
    const leads = await Lead.find().populate({
      path: "banker",
      populate: {
        path: "rm", // Populate the RM field in the Banker schema
        model: "RelationManager",
      },
    });
    // res.json(leads)
    res.render("Admin/admin", { leads });
  } catch (e) {
    res.send("<h2>PLEASE CONTACT DEVELOPER FOR THIS ERROR</h2>");
  }
});

//Get req for add rm
router.get("/addrm", adminCheck, checkApproval, (req, res) => {
  res.render("AddRelationship/addrelationship");
});

//Get req for update rm
router.get("/updateRm", adminCheck, checkApproval, (req, res) => {
  RM.find().then((rm) =>
    res.render("UpdateRelationship/updaterelationship", { rm })
  );
});

//Get req to Appoint rm
router.get("/appointRm", adminCheck, checkApproval, (req, res) => {
  try {
    RM.find().then((rm) => {
      Banker.find().then((bankers) => {
        res.render("AppointRMTOBanker/appointrmtobanker", { rm, bankers });
      });
    });
  } catch (e) {
    res.send(e + " PLEASE CONTACT THE DEVELOPER FOR THIS ERROR");
  }
});

//Get req to Approve Admin request
router.get("/approveAdminReq", adminCheck, checkApproval, (req, res) => {
  try {
    Admin.find({ approval: false }).then((admins) => {
      res.render("ApproveAdminRequest/approveadminrequest", { admins });
    });
  } catch (e) {
    res.send("PLEASE CONTACT THE DEVELOPER FOR THIS ERROR: " + e);
  }
});

//Get req to Approve Banker request
router.get("/approveBanker", adminCheck, checkApproval, (req, res) => {
  try {
    Banker.find({ approval: false }).then((bankers) => {
      res.render("ApproveBanker/approveBanker", { bankers });
    });
  } catch (e) {
    res.send("PLEASE CONTACT THE DEVELOPER FOR THIS ERROR: " + e);
  }
});

//Get req to add services
router.get("/addServices", adminCheck, (req, res) => {
  res.render("AddServices/addservice");
});

//Get req to update service
router.get("/updateService", adminCheck, (req, res) => {
  Service.find().then((services) => {
    res.render("UpdateService/updateservice", { services });
  });
});

//Get req to update service
router.get("/changePassword", adminCheck, checkApproval, (req, res) => {
  res.render("ChangePassword/changepassword");
});

// See Associated banker
router.get(
  "/appointedBankers",

  adminCheck, checkApproval,
  async (req, res) => {
    try {
      const bankers = await Banker.find().populate("rm");
      res.render("list/list", { bankers });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Download excel sheet here

router.get("/download", adminCheck, checkApproval, async (req, res) => {
  try {
    // Fetch all bankers and populate the 'leads.lead' field to get associated leads
    const bankers = await Banker.find().populate("leads");

    // Convert leads data to Excel format
    const formattedLeads = [];

    bankers.forEach((banker) => {
      banker.leads.forEach((leadObj) => {
        const lead = leadObj;

        // Check if 'lead' and 'services' are defined before using them
        if (lead && lead.services && Array.isArray(lead.services)) {
          lead.services.forEach((service) => {
            // Get the lead name (you can customize this based on your data structure)
            const leadName = `${lead.firstName} ${lead.lastName}`;

            const formattedLead = {
              leadId: lead.leadId,
              leadName: leadName,
              generationDate: lead.generationDate.toISOString(),
              status: lead.paymentStatus ? "Completed" : "Pending",
              phone: lead.phone,
              remark: service.remark || "",
              serviceName: service.serviceName,
              amount: service.amount,
              payout: service.payout || 0,
              bankersName: banker.firstName + " " + banker.lastName,
            };

            formattedLeads.push(formattedLead);
          });
        }
      });
    });

    const worksheet = xlsx.utils.json_to_sheet(formattedLeads);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Leads");
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=leads.xlsx");
    res.end(excelBuffer);
  } catch (error) {
    console.error("Error downloading leads:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Download Excel Sheet of banker details
router.get("/downloadBankerDetails", adminCheck, checkApproval, async (req, res) => {
  try {
    const bankers = await Banker.find().populate("rm").exec();

    const data = bankers.map((banker) => ({
      "Banker ID": banker.bankerId,
      "First Name": banker.firstName,
      "Last Name": banker.lastName,
      Email: banker.email,
      Phone: banker.phone,
      PAN: banker.pan,
      RM: banker.rm ? `${banker.rm.firstName} ${banker.rm.lastName}` : "N/A",
      "Account Number": String(banker.bankDetails.accountNumber),
      IFSC: banker.bankDetails.ifsc,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "BankerDetails");

    const buffer = xlsx.write(wb, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=banker_details.xlsx"
    );

    // Write the buffer to the response
    res.end(buffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Forgot password

router.get("/forgotpassword", (req, res) => {
  res.render("ForgotPassword/forgotpasword", { user: "admin" });
});

module.exports = router;