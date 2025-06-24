// utils/sendSMS.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = process.env.TWILIO_PHONE;

const client = twilio(accountSid, authToken);

const sendSMS = async (mobile, message) => {
  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: `+91${mobile}` // Adjust if you're not targeting India
    });
    console.log(`✅ SMS sent to ${mobile}`);
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${mobile}:`, error.message);
  }
};

module.exports = { sendSMS };
