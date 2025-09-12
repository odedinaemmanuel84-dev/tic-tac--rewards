import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Paystack secret key from Render Environment Variables
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Test route
app.get("/", (req, res) => {
  res.send("🎮 Tic Tac Toe Reward Server Running...");
});

// ✅ Create Payment
app.post("/api/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        currency: "NGN"
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// ✅ Verify Payment
app.get("/api/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
