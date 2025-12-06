import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { transporter } from "../utils/mailer.js";

const router = express.Router();



// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({
                message: "All fields required"
            });

        const isExistingUser = await User.findOne({ email });

        if (isExistingUser)
            return res.status(400).json({
                message: "Email already exists"
            });

        const hashed = await bcrypt.hash(password, 5);

        const user = await User.create({ name, email, password: hashed });

        // Send welcome email
        try {
            await transporter.sendMail({
                from: `"Auth App" <${process.env.EMAIL}>`,
                to: email,
                subject: "Welcome 🎉",
                html: `<h2>Hello ${name}, welcome onboard 🚀</h2>`,
            });
        } catch (emailError) {
            console.error("Error sending email:", emailError);
        }

        res.json({
            message: "User registered successfully"
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({
                message: "All fields required"
            });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({
                message: "Invalid email or password"
            });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({
                message: "Invalid email or password"
            });

        const token = jwt.sign({
            id: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.json({
            message: "Login successful",
            token,
            user: { name: user.name, email },
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

export default router
