import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
const cors = require("cors");
app.use(cors());
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Default route (homepage)
app.get("/", (req, res) => {
  res.send("✅ Tic Tac Toe Backend is running successfully!");
});

// API routes
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
