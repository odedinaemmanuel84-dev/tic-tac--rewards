// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors()); // ✅ Allow frontend to talk to backend
app.use(express.json());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auth routes
import authRoutes from "./routes/auth.js";
app.use("/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
