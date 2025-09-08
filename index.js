// server/index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Fake DB for demo
let users = [];

// Root
app.get("/", (req, res) => {
  res.send("✅ Tic-Tac-Toe Rewards API is running...");
});

// Register
app.post("/register", (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: "Missing fields" });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: "User exists" });

  const newUser = { id: users.length + 1, username, email, premium: false };
  users.push(newUser);
  res.json({ message: "User registered", user: newUser });
});

// Login
app.post("/login", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ message: "Login successful", user });
});

// Withdraw (Paystack Payout)
app.post("/withdraw", async (req, res) => {
  const { account_number, bank_code, amount } = req.body;

  if (!account_number || !bank_code || !amount) {
    return res.status(400).json({ error: "Missing withdrawal details" });
  }

  try {
    // Step 1: Resolve account (verify)
    const verify = await axios.get(`https://api.paystack.co/bank/resolve`, {
      params: { account_number, bank_code },
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    // Step 2: Create transfer recipient
    const recipient = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: verify.data.data.account_name,
        account_number,
        bank_code,
        currency: "NGN"
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    // Step 3: Initiate transfer
    const transfer = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100, // Paystack uses kobo
        recipient: recipient.data.data.recipient_code,
        reason: "Tic-Tac-Toe Game Reward"
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({ message: "Withdrawal successful", transfer: transfer.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Withdrawal failed", details: err.response?.data });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
