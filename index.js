const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// 🛠 Dummy in-memory database (use real DB later)
let users = [];

// ✅ Test route
app.get("/", (req, res) => {
  res.json({ message: "✅ TicTacRewards backend is running!" });
});

// ✅ Register route
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "⚠️ All fields are required" });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ success: false, message: "❌ Email already registered" });
  }

  const newUser = { username, email, password };
  users.push(newUser);

  return res.status(201).json({ success: true, message: "✅ Registration successful! Please login." });
});

// ✅ Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "⚠️ Email and password are required" });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: "❌ Invalid email or password" });
  }

  return res.json({
    success: true,
    message: "✅ Login successful!",
    username: user.username
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
