// index.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fetch = require("node-fetch"); // For Paystack API
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

// Middleware for auth
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("🎮 Tic Tac Toe backend with Paystack is running!");
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, email: user.email, balance: user.balance },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deposit via Paystack
app.post("/api/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, email } = req.body;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects kobo
        callback_url: "https://your-frontend.com/payment-success",
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reward user (e.g., after win)
app.post("/api/reward", authMiddleware, async (req, res) => {
  try {
    const { reward } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance += reward;
    await user.save();

    res.json({ message: "Reward added", balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw
app.post("/api/withdraw", authMiddleware, async (req, res) => {
  try {
    const { account_number, bank_code, amount } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    if (amount < parseInt(process.env.MIN_WITHDRAW_AMOUNT)) {
      return res.status(400).json({
        error: `Minimum withdrawal is ${process.env.MIN_WITHDRAW_AMOUNT}`,
      });
    }

    // Paystack transfer recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: user.email,
        account_number,
        bank_code,
        currency: process.env.CURRENCY || "NGN",
      }),
    });
    const recipientData = await recipientRes.json();

    if (!recipientData.status) {
      return res.status(400).json({ error: recipientData.message });
    }

    const recipientCode = recipientData.data.recipient_code;

    // Paystack transfer
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // in kobo
        recipient: recipientCode,
        reason: "TicTacToe game reward",
      }),
    });

    const transferData = await transferRes.json();

    if (transferData.status) {
      user.balance -= amount;
      await user.save();
      res.json({ message: "Withdrawal successful", balance: user.balance });
    } else {
      res.status(400).json({ error: transferData.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
