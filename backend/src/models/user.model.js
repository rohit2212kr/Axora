const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        // ── Email Verification Fields ─────────────────────────
        isVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationOTP: {
            type: String,
            select: false, // SHA-256 hashed, never returned in queries
        },

        emailVerificationExpires: {
            type: Date,
            select: false,
        },

        // ── Password Reset Fields ─────────────────────────────
        passwordResetOTP: {
            type: String,
            select: false, // SHA-256 hashed
        },

        passwordResetExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;