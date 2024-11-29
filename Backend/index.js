import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { auth } from "./config/firebase.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);

// Test route to check Firebase connection
app.get("/test-connection", async (req, res) => {
  try {
    // Make a simple query, e.g., list users
    const users = await auth.listUsers(1); // Fetch only 1 user
    res.status(200).json({ message: "Firebase connected successfully", users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Firebase connection failed", error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀💀 Server is started on port ${PORT}`));
