const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    // Sanitize env vars — strip any accidental whitespace/newlines added by Render's UI
    const emailUser = (process.env.EMAIL_USER || '').replace(/[\r\n\s]/g, '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/[\r\n\s]/g, '').trim();

    if (!emailUser || !emailPass) {
        console.error('[EMAIL CONFIG ERROR] EMAIL_USER or EMAIL_PASS is missing or empty on this server!');
        return;
    }

    console.log(`[EMAIL] Attempting to send from: "${emailUser}" to: "${to}"`);

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            family: 4, // Force IPv4 to prevent ENETUNREACH on Render
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000
        });
        const mailOptions = {
            from: `"rathoreMart" <${emailUser}>`,
            to,
            subject,
            text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] OTP email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error('[EMAIL SEND ERROR] Failed to send email to', to, ':', error.message);
    }
};

module.exports = sendEmail;