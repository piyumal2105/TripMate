import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { auth } from "../config/firebase.js";

// Register user
export const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firebase
    const user = await auth.createUser({
      email,
      password: hashedPassword,
      displayName: fullName,
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// User login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user record by email using Firebase Admin SDK
    const userRecord = await auth.getUserByEmail(email);

    // Generate JWT Token after successful user retrieval
    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expiration
    });

    // Return success response with the JWT and user details
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    });
  } catch (error) {
    // Handle Firebase errors, such as user not found or any other errors
    if (error.code === "auth/user-not-found") {
      res.status(400).json({
        error: "User not found. Please check your email and password.",
      });
    } else if (error.code === "auth/wrong-password") {
      res.status(400).json({ error: "Incorrect password. Please try again." });
    } else {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};
