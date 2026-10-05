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
    const to = req.query.to || 'jatinprakashrathore@gmail.com';
    const sendEmail = require('../utils/sendMail.js');
    try {
        const result = await sendEmail(to, 'rathoreMart Diagnostic via Resend', 'This is a test OTP email from rathoreMart!');
        res.json({ success: true, targetEmail: to, result });
    } catch (err) {
        res.json({ success: false, targetEmail: to, error: err.message });
    }
});
router.get("/users",       protect, admin, getUsers);

module.exports = router;
