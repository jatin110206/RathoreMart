const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendMail");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6-digit OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user as UNVERIFIED
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            verified: false,
            otp,
            otpExpiry,
        });

        // Send OTP email (non-blocking — won't fail registration if SMTP errors)
        sendEmail(
            email,
            'rathoreMart — Verify Your Email 📬',
            `Hi ${name},\n\nWelcome to rathoreMart!\n\nYour email verification OTP is:\n\n  ➤  ${otp}  ◄\n\nThis code is valid for 10 minutes. Do not share it with anyone.\n\nIf you did not create this account, please ignore this email.\n\nTeam rathoreMart`
        ).catch(err => console.warn('OTP email failed (non-critical):', err.message));

        // Return success — user will check their email and type OTP manually
        res.status(201).json({
            success: true,
            needsOTP: true,
            message: 'OTP sent to your email. Please verify to activate your account.',
            email: newUser.email,
        });

    } catch (error) {
        console.error('registerUser error:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.verified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Check OTP match
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check OTP expiry
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Mark user as verified and clear OTP fields
        user.verified   = true;
        user.otp        = null;
        user.otpExpiry  = null;
        await user.save();

        res.json({
            success: true,
            message: "Email verified successfully!",
            _id:   user._id,
            name:  user.name,
            email: user.email,
            role:  user.role,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.verified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Generate fresh OTP and expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp       = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const message = `Hi ${user.name},

You requested a new OTP for rathoreMart email verification.

Your new OTP is: ${otp}

This OTP is valid for 10 minutes. Do not share it with anyone.`;

        // Non-blocking email attempt
        sendEmail(email, "rathoreMart - New OTP", message).catch(err => console.warn('Resend OTP email failed (non-critical):', err.message));

        res.json({ success: true, message: "A new OTP has been sent to your email." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Block login if email not verified
        if (!user.verified) {
            return res.status(403).json({
                message: "Email not verified. Please verify your email before logging in.",
                email: user.email
            });
        }

        res.json({
            success: true,
            _id:   user._id,
            name:  user.name,
            email: user.email,
            role:  user.role,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password -otp -otpExpiry');
        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { registerUser, verifyOTP, resendOTP, LoginUser, getUsers };