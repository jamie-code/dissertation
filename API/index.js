const express = require("express");
const bodyParser = require("body-parser");
var fs = require('fs');
var https = require('https');
const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Bans api." });
});
app.use(function (req, res, next)  {
  
  res.setHeader('Access-Control-Allow-Origin', 'https://jamiez.co.uk');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
require("./routes/player.routes.js")(app);
// set port, listen for requests
var privateKey = fs.readFileSync( '/etc/letsencrypt/live/api.jamiez.co.uk/privkey.pem' );
var certificate = fs.readFileSync( '/etc/letsencrypt/live/api.jamiez.co.uk/cert.pem' );

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(3000);

/*app.listen(3000, () => {
  console.log("Server is running on port 3000.");
});*/

