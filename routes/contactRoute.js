const express = require('express');
const ContactMessage = require('../models/Contact');
const { sendEmail } = require('../utils/sendEmail');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const newMessage = new ContactMessage(req.body);
    await newMessage.save();

    // Send email to admin
    await sendEmail({
      to: 'coralcreekresortbg@gmail.com', // Replace with your real email
      subject: `New Contact Message from ${req.body.name}`,
      text: `
Name: ${req.body.name}
Email: ${req.body.email}
Subject: ${req.body.subject}

Message:
${req.body.message}
      `,
    });

    res.status(201).json({ message: 'Message sent and emailed to admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

module.exports = router;
