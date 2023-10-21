const bcrypt = require("bcrypt");

function changepassword(modelName, req, res, user) {
  const { newPassword, confirmPassword } = req.body;

  if (newPassword === confirmPassword) {
    // bcrypt hash the password before saving
    bcrypt.hash(confirmPassword, 10, (err, hash) => {
      //Password update variable
      if (!err) {
        const updates = {
          password: hash,
        };
        modelName
          .findByIdAndUpdate(user, updates)
          .then((result) =>
            res.send(
              "<p>Password changed successfully go to <a href='/'>Login</a></p>"
            )
          );
      } else {
        res.send("err in bcrypt change password: " + err);
      }
    });
  } else {
    res.send("password did not matched");
  }
}

module.exports = changepassword;
