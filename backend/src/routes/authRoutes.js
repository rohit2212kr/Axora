const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", registerUser);

// POST /api/v1/auth/login
router.post("/login", loginUser);

module.exports = router;
