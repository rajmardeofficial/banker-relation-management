const express = require("express");
const cookieParser = require("cookie-parser");
const https = require("https");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;
require("./db conn/connection");

// Define the path to your frontend views folder
app.set("views", path.join(__dirname, "views"));

// Serve static assets (e.g., CSS and JavaScript) from the public folder
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());  
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set("view engine", "ejs");

const routerAdmin = require("./Routes/adminrouter");
const routerBanker = require("./Routes/bankerrouter");
const routerRM = require("./Routes/rmrouter");

app.use("/admin", routerAdmin);
app.use("/banker", routerBanker);
app.use("/rm", routerRM);

// The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function (req, res) {
  res.render('404/404');
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});

// const sslServer = https.createServer({
//   key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
//   cert: fs.readFileSync(path.join(__dirname,'cert', 'cert.pem'))
// }, app)

// sslServer.listen(PORT, () => {
//   console.log(`Server started on port ${PORT}`);
// })
