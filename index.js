import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const MONGO_URI = process.env.MONGO_URI;

// MongoDB Connect
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error(err));

// Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type:String, unique:true },
  password: String
});
const User = mongoose.model("User", userSchema);

// Register
app.post("/api/auth/register", async (req,res)=>{
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password:hashed });
    await user.save();
    res.json({ message:"User registered successfully" });
  } catch (err) {
    res.status(400).json({ message:"Registration failed", error:err.message });
  }
});

// Login
app.post("/api/auth/login", async (req,res)=>{
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message:"User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message:"Invalid credentials" });

  const token = jwt.sign({ id:user._id }, JWT_SECRET, { expiresIn:"1d" });
  res.json({ token });
});

// Protected test route
app.get("/api/auth/me", async (req,res)=>{
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message:"No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(401).json({ message:"Invalid token" });
  }
});

app.listen(PORT, ()=>console.log(`Backend running on port ${PORT}`));
