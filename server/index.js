// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

let users = {};

// Test root
app.get("/", (req, res) => {
  res.json({ message: "Backend working ✅" });
});

// Register
app.post("/api/register", (req, res) => {
  const { name, email } = req.body;
  if (!users[email]) {
    users[email] = { name, balance: 0, playsLeft: 3, premium: false };
  }
  res.json(users[email]);
});

// Win
app.post("/api/win", (req, res) => {
  const { email } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });

  if (!users[email].premium) {
    if (users[email].playsLeft <= 0) {
      return res.json({ message: "No demo plays left" });
    }
    users[email].playsLeft--;
  }

  let reward = users[email].premium ? 400 : 0;
  users[email].balance += reward;

  res.json(users[email]);
});

// Upgrade (fake demo for now)
app.post("/api/upgrade", (req, res) => {
  const { email } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });
  users[email].premium = true;
  res.json({ message: "User upgraded to premium" });
});

// Withdraw (fake demo for now)
app.post("/api/withdraw", (req, res) => {
  const { email } = req.body;
  if (!users[email]) return res.status(404).json({ error: "User not found" });
  users[email].balance = 0;
  res.json({ success: true, message: "Withdrawal simulated" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
