const crypto = require("crypto");
const User = require("../models/user.model");
const generateToken = require("../utils/generateToken");
const { sendEmail, buildOtpTemplate } = require("../utils/sendEmail");

// ── Helpers ────────────────────────────────────────────────────

/**
 * Generate a random 6-digit OTP string
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * SHA-256 hash a plain-text OTP for safe database storage
 */
const hashOTP = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

// ── 1. Register (Signup) ──────────────────────────────────────

/**
 * Register a new user and send email verification OTP
 * @route POST /api/v1/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate all fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields (name, email, password)",
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists && userExists.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        // If user exists but not verified, delete and allow re-registration
        if (userExists && !userExists.isVerified) {
            await User.deleteOne({ _id: userExists._id });
        }

        // Create new user (password hashed by pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            isVerified: false,
        });

        // Generate and hash OTP
        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);

        user.emailVerificationOTP = hashedOtp;
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        // Send verification email
        await sendEmail({
            to: email,
            subject: `[Axora] Your verification code is ${otp}`,
            html: buildOtpTemplate(otp, "verify"),
            text: `Your Axora verification code is ${otp}. Please enter this 6-digit code to complete your signup and access your workspace. This code will expire in 10 minutes.`,
        });

        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email for a verification code.",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: false,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ── 2. Verify OTP ─────────────────────────────────────────────

/**
 * Verify user email with 6-digit OTP
 * @route POST /api/v1/auth/verify-otp
 * @access Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP",
            });
        }

        // Fetch user with hidden OTP fields
        const user = await User.findOne({ email }).select(
            "+emailVerificationOTP +emailVerificationExpires"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        // Check OTP expiry
        if (!user.emailVerificationExpires || user.emailVerificationExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        // Compare hashed OTPs
        const hashedInput = hashOTP(otp);
        if (hashedInput !== user.emailVerificationOTP) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Mark as verified and clear OTP fields
        user.isVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Generate JWT
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: true,
                token,
            },
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ── 3. Resend OTP ─────────────────────────────────────────────

/**
 * Resend email verification OTP
 * @route POST /api/v1/auth/resend-otp
 * @access Public
 */
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);

        user.emailVerificationOTP = hashedOtp;
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send new verification email
        await sendEmail({
            to: email,
            subject: `[Axora] Your verification code is ${otp}`,
            html: buildOtpTemplate(otp, "verify"),
            text: `Your Axora verification code is ${otp}. Please enter this 6-digit code to complete your signup and access your workspace. This code will expire in 10 minutes.`,
        });

        res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email",
        });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ── 4. Login ──────────────────────────────────────────────────

/**
 * Login user (blocks unverified accounts)
 * @route POST /api/v1/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter both email and password",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Block login for unverified accounts
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in",
                requiresVerification: true,
                email: user.email,
            });
        }

        // Compare passwords
        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: true,
                token,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ── 5. Forgot Password ───────────────────────────────────────

/**
 * Send password reset OTP
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Security: don't reveal if user exists
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a reset code has been sent.",
            });
        }

        // Generate reset OTP
        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);

        user.passwordResetOTP = hashedOtp;
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        // Send reset email
        await sendEmail({
            to: email,
            subject: `[Axora] Your password reset code is ${otp}`,
            html: buildOtpTemplate(otp, "reset"),
            text: `Your Axora password reset code is ${otp}. Please enter this 6-digit code to reset your password and access your workspace. This code will expire in 10 minutes.`,
        });

        res.status(200).json({
            success: true,
            message: "If an account with that email exists, a reset code has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ── 6. Reset Password ────────────────────────────────────────

/**
 * Reset password using OTP
 * @route POST /api/v1/auth/reset-password
 * @access Public
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide email, OTP, and new password",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        // Fetch user with hidden reset fields
        const user = await User.findOne({ email }).select(
            "+passwordResetOTP +passwordResetExpires"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check OTP expiry
        if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Reset code has expired. Please request a new one.",
            });
        }

        // Compare hashed OTPs
        const hashedInput = hashOTP(otp);
        if (hashedInput !== user.passwordResetOTP) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset code",
            });
        }

        // Update password and clear reset fields
        user.password = newPassword; // Will be hashed by pre-save hook
        user.passwordResetOTP = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    resetPassword,
};
