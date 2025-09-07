// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Paystack keys (from .env)
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "";
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC || "";
const WITHDRAW_MIN = process.env.WITHDRAW_MIN || 1000; // kobo (₦1000)

// ✅ Demo mode if keys not provided
const isDemo = !PAYSTACK_SECRET || !PAYSTACK_PUBLIC;

// In-memory database (for demo only — later use real DB)
let users = {};

// Register a player
app.post("/register", (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Missing fields" });

  if (!users[email]) {
    users[email] = { name, balance: 0, plays: 0, upgraded: false };
  }

  return res.json({ message: "Registered", user: users[email], demo: isDemo });
});

// Simulate win
app.post("/win", (req, res) => {
  const { email } = req.body;
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.upgraded) {
    if (user.plays >= 3) return res.status(403).json({ error: "Demo limit reached" });
    user.plays++;
  }

  // Rewards: Demo → ₦0; Premium → ₦400 (example)
  const reward = user.upgraded ? 40000 : 0; // kobo
  user.balance += reward;

  return res.json({ message: "Win recorded", balance: user.balance });
});

// Upgrade (deposit)
app.post("/upgrade", async (req, res) => {
  const { email, amount } = req.body; // amount in kobo
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  if (isDemo) {
    user.upgraded = true;
    return res.json({ message: "Demo upgrade complete (no real payment)" });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        callback_url: "https://your-frontend-site.com/payment-success"
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    return res.json(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Withdraw
app.post("/withdraw", async (req, res) => {
  const { email, bank_code, account_number } = req.body;
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.balance < WITHDRAW_MIN) {
    return res.status(400).json({ error: "Balance too low to withdraw" });
  }

  if (isDemo) {
    user.balance = 0;
    return res.json({ message: "Demo withdraw successful (no real money)" });
  }

  try {
    // 1. Create transfer recipient
    const recipientRes = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: user.name,
        account_number,
        bank_code,
        currency: "NGN"
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const recipientCode = recipientRes.data.data.recipient_code;

    // 2. Initiate transfer
    const transferRes = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: user.balance,
        recipient: recipientCode,
        reason: "TicTacToe reward"
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    user.balance = 0;
    return res.json({ message: "Withdrawal successful", data: transferRes.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("✅ Tic-Tac-Rewards backend is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
