const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ------------------ Demo Database (memory only) ------------------
let users = {}; // { email: { name, tier, balance } }

// ------------------ Environment Variables ------------------
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET; // Render → Environment
const WITHDRAW_MIN = process.env.WITHDRAW_MIN || 1000;

// ------------------ Routes ------------------

// Register/Login
app.post("/register", (req, res) => {
  const { name, email } = req.body;
  if (!users[email]) {
    users[email] = { name, tier: "demo", balance: 0 };
  }
  res.json({ message: "Registered/Login successful", user: users[email] });
});

// Win game → add reward
app.post("/win", (req, res) => {
  const { email } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });

  let reward = 0;
  if (users[email].tier === "500") reward = 50;
  else if (users[email].tier === "1000") reward = 100;
  else if (users[email].tier === "5000") reward = 500;

  users[email].balance += reward;
  res.json({ balance: users[email].balance });
});

// Upgrade to premium (Paystack checkout)
app.post("/upgrade", async (req, res) => {
  const { email, amount } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: email,
        amount: amount * 100, // Paystack expects kobo
        callback_url: "https://your-frontend.netlify.app",
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    // Save chosen tier temporarily
    users[email].tier = String(amount);

    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Paystack error" });
  }
});

// Withdraw funds
app.post("/withdraw", async (req, res) => {
  const { email, account_number, bank_code } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });

  if (users[email].balance < WITHDRAW_MIN) {
    return res.json({ message: "Balance too low to withdraw" });
  }

  try {
    // 1. Create transfer recipient
    const recipient = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: users[email].name,
        account_number,
        bank_code,
        currency: "NGN",
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    // 2. Transfer
    const transfer = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        reason: "TicTacRewards Withdrawal",
        amount: users[email].balance * 100,
        recipient: recipient.data.data.recipient_code,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    users[email].balance = 0; // reset after withdrawal
    res.json({ message: "Withdrawal successful", transfer: transfer.data.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Paystack withdrawal error" });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
