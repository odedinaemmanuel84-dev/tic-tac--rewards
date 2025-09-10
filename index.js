import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🗂 In-memory users (temporary storage)
let users = [];

// ✅ Home route (fix for "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🎮 Tic-Tac-Toe Rewards Backend is running!");
});

// ✅ Register
app.post("/register", (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: "Missing fields" });

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = { username, email, balance: 0, plan: "demo" };
  users.push(newUser);
  res.json({ message: "Registered!", user: newUser });
});

// ✅ Login
app.post("/login", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ error: "User not found" });
  res.json({ message: "Logged in!", user });
});

// ✅ Win → reward ₦400
app.post("/win", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.balance += 400;
  res.json({ message: "Reward added!", user });
});

// ✅ Withdraw (demo only)
app.post("/withdraw", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.balance < 400) {
    return res.status(400).json({ error: "Not enough balance to withdraw" });
  }

  user.balance -= 400;
  res.json({ message: "Withdraw successful! (demo)", user });
});

// ✅ Upgrade (demo only)
app.post("/upgrade", (req, res) => {
  const { email, amount } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (amount < 500) return res.status(400).json({ error: "Minimum is ₦500" });

  user.plan = "premium";
  res.json({ message: `Upgraded with ₦${amount}`, user });
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
