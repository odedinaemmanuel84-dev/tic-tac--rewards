import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 0 },
  playsLeft: { type: Number, default: 1 },
  premium: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  wins: { type: Number, default: 0 },
  history: [{
    result: String,
    mode: String,
    reward: Number,
    at: { type: Date, default: Date.now }
  }],
  tier: { type: Number, default: 0 },
  rewardCap: { type: Number, default: 0 },
  perWinReward: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// --- Helpers ---
function setTierRewards(user, tierAmount) {
  user.tier = tierAmount;
  user.rewardCap = Math.round(tierAmount * 0.8);
  const winsToExhaust = Math.max(6, Math.min(12, Math.round(10 * (500 / Math.max(500, tierAmount)))));
  user.perWinReward = Math.max(1, Math.floor(user.rewardCap / winsToExhaust));
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

// --- Routes ---
app.get("/", (req, res) => res.send("Tic-Tac-Toe Backend is running!"));

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ name, email, password: hashed });
    await u.save();
    res.json({ message: "Registered successfully" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(400).json({ error: "Invalid email or password" });
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { name: u.name, email: u.email, balance: u.balance, premium: u.premium, level: u.level, wins: u.wins, perWinReward: u.perWinReward, rewardCap: u.rewardCap } });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Me
app.get("/api/me", authMiddleware, async (req, res) => {
  const u = await User.findById(req.userId);
  res.json({ user: { name: u.name, email: u.email, balance: u.balance, playsLeft: u.playsLeft, premium: u.premium, level: u.level, wins: u.wins, perWinReward: u.perWinReward, rewardCap: u.rewardCap, history: u.history.slice(0,20) } });
});

// Win
app.post("/api/win", authMiddleware, async (req, res) => {
  try {
    const { mode = "ai" } = req.body;
    const u = await User.findById(req.userId);
    if (!u.premium && u.playsLeft <= 0) return res.status(400).json({ error: "No demo plays left" });
    if (!u.premium) u.playsLeft = Math.max(0, u.playsLeft - 1);
    const add = u.perWinReward || 0;
    const canAdd = Math.max(0, (u.rewardCap || 0) - u.balance);
    const credit = Math.min(add, canAdd);
    u.balance += credit;
    u.wins = (u.wins || 0) + 1;
    u.history.unshift({ result: "win", mode, reward: credit });
    if (u.history.length > 50) u.history = u.history.slice(0, 50);
    const winsForNextLevel = 5;
    const newLevel = 1 + Math.floor(u.wins / winsForNextLevel);
    if (newLevel > u.level) {
      u.level = newLevel;
      const bonus = Math.round((u.tier || 500) * 0.05);
      u.balance += bonus;
      u.history.unshift({ result: "level-up", mode: "system", reward: bonus });
    }
    await u.save();
    res.json({ balance: u.balance, playsLeft: u.playsLeft, level: u.level, wins: u.wins, perWinReward: u.perWinReward, rewardCap: u.rewardCap, history: u.history.slice(0,10) });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Upgrade (Paystack demo)
app.post("/api/upgrade", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const u = await User.findById(req.userId);
    u.premium = true;
    setTierRewards(u, amount);
    u.playsLeft = 9999;
    await u.save();
    res.json({ message: "Upgraded", user: u });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// Withdraw (simplified demo, you can expand with Paystack Transfers)
app.post("/api/withdraw", authMiddleware, async (req, res) => {
  try {
    const { account_number, account_name } = req.body;
    const u = await User.findById(req.userId);
    if (u.balance < 100) return res.status(400).json({ error: "Min ₦100 to withdraw" });
    const amt = u.balance;
    u.balance = 0;
    u.history.unshift({ result: "withdraw", mode: "system", reward: -amt });
    await u.save();
    res.json({ message: `Simulated payout ₦${amt} to ${account_number}`, balance: u.balance });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Backend running on " + PORT));
