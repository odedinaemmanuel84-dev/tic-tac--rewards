
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "";
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC || "";
const WITHDRAW_MIN = process.env.WITHDRAW_MIN || 1000; // in kobo (₦1000 = 100000)

let users = {}; // fake in-memory DB

// Register
app.post("/api/register", (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  if (!users[email]) {
    users[email] = { name, balance: 0, demoPlays: 3, premium: false };
  }
  res.json({ message: "Registered", user: users[email], PAYSTACK_PUBLIC });
});

// Play demo
app.post("/api/play-demo", (req, res) => {
  const { email } = req.body;
  if (!users[email]) return res.status(400).json({ error: "User not found" });

  if (users[email].demoPlays > 0) {
    users[email].demoPlays -= 1;
    res.json({ success: true, remaining: users[email].demoPlays });
  } else {
    res.json({ success: false, message: "Demo finished" });
  }
});

// Upgrade (start Paystack checkout)
app.post("/api/upgrade", async (req, res) => {
  const { email, amount } = req.body;
  if (!users[email]) return res.status(400).json({ error: "User not found" });

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // convert Naira to kobo
        callback_url: "https://your-frontend.netlify.app", // change later
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    res.json({ auth_url: response.data.data.authorization_url });
  } catch (err) {
    res.status(500).json({ error: "Paystack error", details: err.message });
  }
});

// Reward on win
app.post("/api/win", (req, res) => {
  const { email, reward } = req.body;
  if (!users[email]) return res.status(400).json({ error: "User not found" });

  if (!users[email].premium)
    return res.status(400).json({ error: "Not premium" });

  users[email].balance += reward;
  res.json({ balance: users[email].balance });
});

// Withdraw
app.post("/api/withdraw", async (req, res) => {
  const { email, bankCode, accountNumber } = req.body;
  if (!users[email]) return res.status(400).json({ error: "User not found" });

  if (users[email].balance < WITHDRAW_MIN) {
    return res.status(400).json({ error: "Minimum withdrawal not met" });
  }

  // NOTE: For real system, you must verify account number with Paystack
  // Here we simulate
  users[email].balance = 0;
  res.json({ message: "Withdrawal successful (simulated)" });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
