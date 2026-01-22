require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp-relay.brevo.com
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Railway needs this
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// 🔎 Verify SMTP on startup (VERY IMPORTANT)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP VERIFY FAILED:', error.message);
  } else {
    console.log('✅ SMTP READY');
  }
});

exports.sendEmail = async (to, subject, message) => {
  const mailOptions = {
    from: `"SDG Classification & Analytics" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text: message,
  };

  return transporter.sendMail(mailOptions);
};
