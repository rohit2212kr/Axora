const express = require("express");
const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", registerUser);

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", verifyOTP);

// POST /api/v1/auth/resend-otp
router.post("/resend-otp", resendOTP);

// POST /api/v1/auth/login
router.post("/login", loginUser);

// POST /api/v1/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/v1/auth/reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
