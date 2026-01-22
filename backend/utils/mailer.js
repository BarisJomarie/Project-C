require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');


// Configure Brevo API client
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;


const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();


/**
 * Send email using Brevo Transactional Email API
 * @param {string} to
 * @param {string} subject
 * @param {string} message (plain text or HTML)
 */
exports.sendEmail = async (to, subject, message) => {
  const emailData = {
    sender: {
      email: process.env.EMAIL_FROM,
      name: 'SDG Classification & Analytics',
    },
    to: [{ email: to }],
    subject,
    htmlContent: message.replace(/\n/g, '<br/>'), // supports your text emails
  };


  try {
    await tranEmailApi.sendTransacEmail(emailData);
  } catch (error) {
    console.error('Brevo email error:', error);
    throw error;
  }
};


