require("dotenv").config();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmail = async (to, subject, message) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_USER,
      subject,
      text: message,
    };
    await sgMail.send(msg);
    console.log("Email sent successfully");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
};
