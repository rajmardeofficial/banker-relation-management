require('dotenv').config();
const bcrypt = require('bcrypt');
const session = require('express-session');

// Set up your session middleware
const setupSession = session({
  secret: process.env.ACCESS_TOKEN_SECRET,
  resave: false,
  saveUninitialized: true
});

exports.login = async (modelName, req, res, redirectURL) => {
  const { email, password } = req.body;

  try {
    const results = await modelName.find({ email });

    if (results.length > 0) {
      const passwordMatch = await bcrypt.compare(password, results[0].password);

      if (passwordMatch) {
        // Create a session for the user
        req.session.user = { email: email, id: results[0]._id };

        res.redirect(redirectURL);
      } else {
        console.log("Password incorrect");
        res.status(401).send("<h2>Incorrect Password</h2>");
      }
    } else {
      console.log("Cannot find the user with the email.");
      res.status(404).send("<h2>User Not Found</h2>");
    }
  } catch (error) {
    console.error("Error finding user by email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.signup = async (modelName, req, res) => {
  const { name, email, phone, password } = req.body;
  const saltRounds = 10;

  try {
    // Hash the password before saving it in the database
    const hash = await bcrypt.hash(password, saltRounds);

    // Check if the user already exists in the database
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

exports.logout = (req, res, route) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    // Redirect to the login page or any other desired page
    res.redirect(route);
  });
};

// Export the session middleware for use in your main app file
exports.setupSession = setupSession;
