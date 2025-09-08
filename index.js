// server/index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(bodyParser.json());

// 🔹 In-memory users (temporary for demo)
// In real life, use a database (MongoDB, PostgreSQL, etc.)
let users = [];

// ✅ Root route (check if server is live)
app.get("/", (req, res) => {
  res.send("✅ Tic-Tac-Toe Rewards API is running...");
});

// ✅ Test route
app.get("/test", (req, res) => {
  res.json({ message: "API working fine!" });
});

// ✅ Register route
app.post("/register", (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email required" });
  }

  // check if user exists
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = { id: users.length + 1, username, email, premium: false };
  users.push(newUser);

  res.json({ message: "User registered", user: newUser });
});

// ✅ Login route
app.post("/login", (req, res) => {
  const { email } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ message: "Login successful", user });
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
