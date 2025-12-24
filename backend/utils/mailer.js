require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,                      
  auth: {
    user: process.env.EMAIL_USER,     
    pass: process.env.EMAIL_PASS,     
  },
});

exports.sendEmail = async (to, subject, message) => {
  const mailOptions = {
    from: `"SDG Classification & Analytics" <${process.env.EMAIL_FROM}>`, 
    to,
    subject,
    text: message,  
  };

  await transporter.sendMail(mailOptions);
};
