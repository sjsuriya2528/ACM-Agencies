const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const testEmail = async () => {
    console.log('Testing with credentials:');
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MISSING');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter is ready to take our messages');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Campa Backend Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: "Campa Live SMTP Test",
            text: "If you see this, your Gmail SMTP is working!",
            html: "<b>If you see this, your Gmail SMTP is working!</b>",
        });

        console.log('✅ Message sent: %s', info.messageId);
        process.exit(0);
    } catch (error) {
        console.error('❌ Email test failed:');
        console.error(error);
        process.exit(1);
    }
};

testEmail();
