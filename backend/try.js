const { sendEmail } = require("./utils/mailer");
require("dotenv").config({ path: "../.env" }); // if try.js is inside backend/


console.log("Loaded API Key:", process.env.SENDGRID_API_KEY);


sendEmail("fuentiblanca.il.bsinfotech@gmail.com", "Test Email", "This is a test message.")
  .then(() => console.log("Test complete"))
  .catch(err => console.error("Test failed:", err));

