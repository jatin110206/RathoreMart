const nodemailer=require('nodemailer');

const sendEmail = async (to, subject, text) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EMAIL CONFIG ERROR] EMAIL_USER or EMAIL_PASS environment variable is missing on this server!');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: `"rathoreMart" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] OTP email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error('[EMAIL SEND ERROR] Failed to send email to', to, error.message);
    }
};

module.exports = sendEmail;