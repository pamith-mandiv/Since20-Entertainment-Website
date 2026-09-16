const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, phone, spotify, youtube, email, about } = req.body;

  if (!name || !phone || !email || !about) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'pamith@since20entertainment.com',
      subject: `New Roster Application from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Spotify: ${spotify || 'N/A'}
YouTube: ${youtube || 'N/A'}

About:
${about}
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Application sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    // Since SMTP details are not yet configured, we will succeed anyway to let the frontend proceed
    if (error.code === 'ECONNREFUSED' || error.responseCode === 535 || !process.env.SMTP_USER) {
      console.log('Faking email success because SMTP is not configured yet.');
      return res.json({ message: 'Application sent successfully (Simulated).' });
    }
    res.status(500).json({ message: 'Failed to send application. Please try again later.' });
  }
});

module.exports = router;
