const { sendEmail } = require("./nodemailer");
const bcrypt = require("bcrypt");

// Generate Random password
function generateRandomPassword(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }

  return password;
}

const randomPassword = generateRandomPassword(8);

//Forgot password logic
function forgotPassword(modelName, req, res) {
  const { email } = req.body;

  modelName.findOne({ email: email }).then((result) => {
    console.log(result);
    if (result) {
      bcrypt.hash(randomPassword, 10, function (err, hash) {
        modelName.updateOne({ email: email }, { password: hash }).then(
          sendEmail(
            email,
            `Password Reset Bankers Partners: ${randomPassword}`,
            `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Request</title>
            </head>
            
            <body>
                <p>Dear ${result.name},</p>
            
                <p>We received a request to reset the password associated with your account. To proceed with the password reset, please follow the instructions below:</p>
            
                <p>This is your temporary password: <strong>${randomPassword}</strong> for your email: <strong>${result.email}</strong></p>
                <p>We advise you to change the password after login. Ensure that your new password is strong.</p>
            
                <p>If you did not initiate this password reset request, please contact our support team immediately at <a href="mailto:contact@bankerspartner.com">contact@bankerspartner.com</a>.</p>
            
                <p>Please note that this password is known to you only.</p>
            
                <p>We take the security of your account seriously, and this process is designed to protect your information. If you have any concerns or questions, feel free to reach out to our support team.</p>
            
                <p>Thank you for your cooperation.</p>
            
                <p>Best regards,<br>
                    bankerspartner.com<br>
                    <a href="mailto:contact@bankerspartner.com">contact@bankerspartner.com</a>
                </p>
            </body>
            
            </html>`,
            (err, data) => {
              if (err) {
                res.status(500).json({ error: "Error sending email" });
              } else {
                res
                  .status(200)
                  .send(
                    `<h1>Your password was sent to your email <a href='/'>Login</a></h1>`
                  );
              }
            }
          )
        );
      });
    } else {
      res.send("Could not find account with email");
    }
  });
}

module.exports = forgotPassword;
