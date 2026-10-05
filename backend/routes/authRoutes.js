const express = require("express");
const router  = express.Router();

const { registerUser, verifyOTP, resendOTP, LoginUser, getUsers } = require("../controlers/authController.js");
const { admin }   = require('../middleware/adminMiddleware.js');
const { protect } = require('../middleware/authMiddleware.js');

router.post("/register",   registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login",      LoginUser);
router.get("/diagnostic-email", async (req, res) => {
    const nodemailer = require('nodemailer');
    const emailUser = (process.env.EMAIL_USER || '').replace(/[\r\n\s]/g, '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/[\r\n\s]/g, '').trim();
    const to = req.query.to || emailUser;

    const debug = {
        hasUser: !!emailUser,
        userLength: emailUser.length,
        userMasked: emailUser.replace(/(.{3})(.*)(@.*)/, '$1***$3'),
        hasPass: !!emailPass,
        passLength: emailPass.length,
        passPreview: emailPass ? `${emailPass.slice(0, 2)}***${emailPass.slice(-2)}` : null,
        targetEmail: to
    };

    try {
        const port = req.query.port ? parseInt(req.query.port) : 587;
        const secure = port === 465;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: port,
            secure: secure,
            auth: { user: emailUser, pass: emailPass },
            family: 4, // FORCE IPv4 to avoid Render's ENETUNREACH on IPv6!
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000
        });

        const info = await transporter.sendMail({
            from: `"rathoreMart" <${emailUser}>`,
            to,
            subject: 'rathoreMart Diagnostic Test (IPv4)',
            text: `This is a test email from rathoreMart backend via port ${port} (IPv4)!`
        });

        res.json({ success: true, debug: { ...debug, port, secure }, messageId: info.messageId });
    } catch (err) {
        res.json({ success: false, debug, error: err.message, code: err.code, response: err.response });
    }
});
router.get("/users",       protect, admin, getUsers);

module.exports = router;
