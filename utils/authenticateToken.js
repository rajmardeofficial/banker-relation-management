require("dotenv").config();
exports.authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).send("No token found"); // Send a response and return
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).send("Token invalid"); // Send a response and return
    }
    req.admin = admin;
    next(); // Call next to continue to the next middleware/route
  });
};
