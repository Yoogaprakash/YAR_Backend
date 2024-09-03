const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/submit', async (req, res) => {
    const { name, email, phone, formType } = req.body;

    // Configure your email transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'web.yarts@gmail.com',
            pass: 'y@rt5WEB2024', // Ensure to use environment variables for sensitive information
        },
    });

    // Compose email content
    let mailOptions = {
        from: 'web.yarts@gmail.com',
        to: email,
        subject: `Application Received for ${formType}`,
        text: `Hello ${name},

Thank you for your interest in our ${formType}. We have received your application and will review it shortly.

Best regards,
YAR Technology Services`,
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Application submitted and email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send email.');
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
