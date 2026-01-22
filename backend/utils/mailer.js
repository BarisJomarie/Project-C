require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter;

function createTransporter() {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // 587 = STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
}

// Create once
createTransporter();

exports.sendEmail = async (to, subject, message) => {
  try {
    return await transporter.sendMail({
      from: `"SDG Classification & Analytics" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text: message,
    });
  } catch (err) {
    console.error('❌ EMAIL FAILED:', err.message);
    return null; // 🚑 NEVER crash login
  }
};
