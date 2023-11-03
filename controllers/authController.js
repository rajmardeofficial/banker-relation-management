// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = (user, modelName, req, res, redirectURL) => {
  const { email, password } = req.body;
  modelName.find({ email }).then((results, err) => {
    if (!err) {
      if (results.length > 0) {
        bcrypt.compare(password, results[0].password, (err, result) => {
          if (!err) {
            if (result) {
              user = { email: email, id: results[0]._id };
              const expirationTimeInSeconds = 3600 * 2;
              const accessToken = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: expirationTimeInSeconds }
              );
              res.cookie("jwt", accessToken, {
                httpOnly: true,
                secure: true, // Set to true for HTTPS
                // domain: "bankerspartner.com",
              });
              res.redirect(redirectURL);
            } else {
              console.log("Password incorrect");
              res.status(401).json({ message: "Incorrect password" });
            }
          } else {
            console.error("Error comparing passwords:", err);
            res.status(500).json({ message: "Internal server error" });
          }
        });
      } else {
        console.log(
          "Cannot find the user with the email. Please check the email you entered"
        );
        res.status(404).json({ message: "User not found" });
      }
    } else {
      console.error("Error finding user by email:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
};

// Sign up code

exports.signup = async (modelName, req, res) => {
  const { name, email, phone, password } = req.body;
  const saltRounds = 10;

  try {
    // Hash the password before saving it in the database
    const hash = await bcrypt.hash(password, saltRounds);

    // Check if the admin already exists in the database
    const existingUser = await modelName.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new modelName({
      name,
      email,
      phone,
      password: hash,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Logout

exports.logout = (req, res, route) => {
  // Clear the JWT cookie by setting its expiration date to the past
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: true, // Set to true for HTTPS
  });

  // Redirect to the login page or any other desired page
  res.redirect(route);
};
