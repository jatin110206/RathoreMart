const nodemailer = require('nodemailer');

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();

const sendEmail = async (to, subject, text) => {
    // 1. Try Resend HTTPS API first (Port 443 — NEVER blocked by Render or cloud firewalls)
    if (RESEND_API_KEY) {
        try {
            console.log(`[EMAIL] Sending via Resend HTTPS API to: "${to}"`);
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'rathoreMart <onboarding@resend.dev>',
                    to: [to],
                    subject,
                    text
                })
            });

            const data = await res.json();
            if (res.ok) {
                console.log(`[RESEND SUCCESS] Email sent to ${to}:`, data.id);
                return { success: true, provider: 'resend', id: data.id };
            } else {
                console.warn(`[RESEND NOTICE] ${data.message}`);
            }
        } catch (e) {
            console.warn('[RESEND ERROR]', e.message);
        }
    }

    // 2. Fallback to Nodemailer SMTP
    const emailUser = (process.env.EMAIL_USER || '').replace(/[\r\n\s]/g, '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/[\r\n\s]/g, '').trim();

    if (!emailUser || !emailPass) {
        console.error('[EMAIL CONFIG ERROR] EMAIL_USER or EMAIL_PASS is missing or empty on this server!');
        return;
    }

    console.log(`[EMAIL] Attempting SMTP fallback from: "${emailUser}" to: "${to}"`);

    try {
        const dns = require('dns').promises;
        let hostIp = '192.178.158.108';
        try {
            const addrs = await dns.resolve4('smtp.gmail.com');
            if (addrs && addrs.length > 0) hostIp = addrs[0];
        } catch (e) {
            console.warn('[EMAIL] DNS resolve4 failed, using fallback Google SMTP IPv4');
        }

        const transporter = nodemailer.createTransport({
            host: hostIp,
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                servername: 'smtp.gmail.com'
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
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