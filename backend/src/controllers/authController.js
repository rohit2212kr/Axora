const User = require("../models/user.model");
const generateToken = require("../utils/generateToken");

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Edge Case 1: Validate that all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields (name, email, password)",
            });
        }

        // Edge Case 2: Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        // Create new user (password will be hashed automatically by pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Return success response with user data and token
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: token,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Edge Case 1: Validate that both email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter both email and password",
            });
        }

        // Edge Case 2: Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare entered password with hashed password in database
        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Return success response with user data and token
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: token,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
