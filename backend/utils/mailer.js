const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

// verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email server connection failed:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

exports.sendEmail = async (to, subject, message) => {
  try {
    const mailOptions = {
      from: `"SDG Classification and Analytics" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
};
