
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 5000;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET; // Put in Render environment

app.use(cors());
app.use(bodyParser.json());

// In-memory storage (use database later)
let users = [];

/** Register a new user */
app.post("/register", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Missing data" });

  if (!users.find(u => u.email === email)) {
    users.push({ name, email, balance: 0 });
  }
  res.json({ message: "User registered successfully" });
});

/** Simulate win */
app.post("/win", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(404).json({ error: "User not found" });

  user.balance += 400; // Reward
  res.json({ reward: 400, balance: user.balance });
});

/** Withdraw request */
app.post("/withdraw", async (req, res) => {
  const { email, account, bank } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.balance < 400) return res.json({ message: "Not enough balance" });

  try {
    // Example payout call to Paystack (disabled for demo)
    /*
    const response = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: user.balance * 100, // kobo
        recipient: account,
        reason: "TicTacToe reward",
      }),
    });
    */

    const payout = { status: "success" }; // fake response

    if (payout.status === "success") {
      user.balance = 0;
      res.json({ message: "Withdrawal successful!" });
    } else {
      res.json({ message: "Withdrawal failed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
