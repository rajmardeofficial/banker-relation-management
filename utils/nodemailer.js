require('dotenv').config()
const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net', // Replace with your provider's SMTP server
  port: 465, // Use the appropriate port for your provider (465 for secure connection)
  secure: true, // Use SSL/TLS
  auth: {
    user: "contact@bankerspartner.com",
    pass: process.env.NODEMAILER_PASSWORD
  }
});

// Define a function to send emails
function sendEmail(to, subject, text, callback) {
  const mailDetails = {
    from: "contact@bankerspartner.com",
    to: to,
    subject: subject,
    html: text,
  };

  mailTransporter.sendMail(mailDetails, (err, data) => {
    if (err) {
      console.error("Error Occurs:", err);
    } else {
      console.log("Email sent successfully");
    }

    if (typeof callback === "function") {
      callback(err, data);
    }
  });
}

module.exports = { sendEmail };
