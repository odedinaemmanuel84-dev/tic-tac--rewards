const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Config
const PORT = process.env.PORT || 3000;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "demo_secret";
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC || "demo_public";
const WITHDRAW_MIN = process.env.WITHDRAW_MIN || 1000; // in kobo (₦1000)

// ✅ Temporary storage (in-memory)
let users = {};

// Register a new player
app.post("/api/register", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name & Email required" });

  if (!users[email]) {
    users[email] = { name, balance: 0, plays: 3, premium: false };
  }
  res.json({ message: "Player registered", user: users[email] });
});

// Play a demo game
app.post("/api/play", (req, res) => {
  const { email, win } = req.body;
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.premium) {
    if (user.plays <= 0) return res.json({ error: "Demo limit reached" });
    user.plays -= 1;
  }

  if (win) {
    let reward = user.premium ? 400 : 0; // demo gives nothing, premium gives ₦400
    user.balance += reward;
    return res.json({ message: "You won!", reward, balance: user.balance });
  } else {
    return res.json({ message: "You lost!", balance: user.balance });
  }
});

// Upgrade to premium (Paystack payment)
app.post("/api/upgrade", async (req, res) => {
  const { email, amount } = req.body;
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  // DEMO mode
  if (PAYSTACK_SECRET === "demo_secret") {
    user.premium = true;
    return res.json({ message: "Upgraded to Premium (Demo)", user });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100 // Paystack expects kobo
      },
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw money
app.post("/api/withdraw", async (req, res) => {
  const { email, accountNumber, bankCode } = req.body;
  const user = users[email];
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.balance < WITHDRAW_MIN) {
    return res.status(400).json({ error: "Balance too low to withdraw" });
  }

  // DEMO mode
  if (PAYSTACK_SECRET === "demo_secret") {
    user.balance = 0;
    return res.json({ message: "Withdrawal simulated (Demo)", balance: user.balance });
  }

  try {
    // 1. Create transfer recipient
    const recipient = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: user.name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
      },
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );

    const recipientCode = recipient.data.data.recipient_code;

    // 2. Initiate transfer
    const transfer = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: user.balance * 100, // in kobo
        recipient: recipientCode,
        reason: "Tic-Tac-Toe Reward"
      },
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      }
    );

    user.balance = 0;
    res.json({ message: "Withdrawal successful", transfer: transfer.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
