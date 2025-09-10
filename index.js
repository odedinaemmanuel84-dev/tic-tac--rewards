const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Temporary in-memory "database"
const users = [];

// ✅ Test route
app.get("/", (req, res) => {
  res.json({ message: "✅ TicTacRewards backend is running!" });
});

// ✅ Register route
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 8);

  // Save user
  users.push({ username, email, password: hashedPassword });

  res.json({ message: "User registered successfully", username });
});

// ✅ Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  // Create JWT (for session management later)
  const token = jwt.sign({ email: user.email }, "secretkey", { expiresIn: "1h" });

  res.json({ message: "Login successful", username: user.username, token });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
