const express = require("express");
const router  = express.Router();

const { registerUser, verifyOTP, resendOTP, LoginUser, getUsers } = require("../controllers/authController.js");
const { admin }   = require('../middleware/adminMiddleware.js');
const { protect } = require('../middleware/authMiddleware.js');

router.post("/register",   registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login",      LoginUser);
router.get("/users",       protect, admin, getUsers);

module.exports = router;
