// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Temporary in-memory database
let users = [];

app.use(cors());
app.use(express.json());

// Home route (to avoid "Cannot GET /")
app.get("/", (req, res) => {
  res.send("✅ TicTacRewards backend is running!");
});

// Register route
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ username, email, password });
  res.json({ message: "User registered successfully!" });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  res.json({ message: "Login successful", username: user.username });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
