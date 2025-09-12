import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MongoDB setup ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.error(err));

// --- User model ---
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    balance: { type: Number, default: 0 },
    playsLeft: { type: Number, default: 1 },
    premium: { type: Boolean, default: false }
});
const User = mongoose.model("User", userSchema);

// --- Paystack secret ---
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// --- REGISTER / LOGIN ---
app.post("/api/register", async (req,res)=>{
    try{
        const { name, email } = req.body;
        let user = await User.findOne({ email });
        if(!user){
            user = new User({ name, email });
            await user.save();
        }
        res.json(user);
    }catch(err){
        console.error(err);
        res.status(500).json({ error:"Server error" });
    }
});

// --- WIN / REWARD ---
app.post("/api/win", async (req,res)=>{
    try{
        const { email } = req.body;
        const user = await User.findOne({ email });
        if(!user) return res.json({ status:"error", message:"User not found" });

        let reward = 400;
        if(user.premium) reward = 400 + (user.playsLeft * 50);

        user.balance += reward;
        user.playsLeft = user.premium ? user.playsLeft : 1;
        await user.save();

        res.json({ balance:user.balance, playsLeft:user.playsLeft });
    }catch(err){
        console.error(err);
        res.status(500).json({ status:"error", message:"Server error" });
    }
});

// --- UPGRADE ---
app.post("/api/upgrade", async (req,res)=>{
    try{
        const { email, amount } = req.body;
        const user = await User.findOne({ email });
        if(!user) return res.json({ status:"error", message:"User not found" });

        const initRes = await fetch("https://api.paystack.co/transaction/initialize",{
            method:"POST",
            headers:{
                Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                email: user.email,
                amount: amount*100,
                currency:"NGN",
                callback_url: process.env.FRONTEND_URL
            })
        });
        const data = await initRes.json();
        if(data.status){
            user.premium = true;
            user.playsLeft = 10;
            await user.save();
            res.json({ authorization_url:data.data.authorization_url });
        }else{
            res.json({ status:"error", message:"Payment initialization failed" });
        }
    }catch(err){
        console.error(err);
        res.status(500).json({ status:"error", message:"Server error" });
    }
});

// --- RESOLVE BANK ACCOUNT ---
async function resolveBankAccount(account_number){
    const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=057`,{
        method:"GET",
        headers:{
            Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type":"application/json"
        }
    });
    const data = await res.json();
    if(!data.status) throw new Error("Bank account could not be resolved");
    return data.data;
}

// --- WITHDRAW ---
app.post("/api/withdraw", async (req,res)=>{
    try{
        const { email, account_number, account_name } = req.body;
        const user = await User.findOne({ email });
        if(!user || user.balance<=0) return res.json({ status:"error", message:"No balance to withdraw" });

        const bankData = await resolveBankAccount(account_number);

        // Create recipient
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient",{
            method:"POST",
            headers:{
                Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                type:"nuban",
                name: account_name,
                account_number: account_number,
                bank_code: bankData.bank_code,
                currency:"NGN"
            })
        });
        const recipientData = await recipientRes.json();
        if(!recipientData.status) throw new Error("Recipient creation failed");

        // Transfer
        const transferRes = await fetch("https://api.paystack.co/transfer",{
            method:"POST",
            headers:{
                Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                source:"balance",
                reason:"Tic-Tac-Toe Reward",
                amount:user.balance*100,
                recipient: recipientData.data.recipient_code
            })
        });
        const transferData = await transferRes.json();
        if(!transferData.status) throw new Error("Transfer failed");

        user.balance=0;
        await user.save();
        res.json({ status:"success", message:"Withdrawal successful" });

    }catch(err){
        console.error(err);
        res.status(500).json({ status:"error", message: err.message });
    }
});

app.listen(PORT, ()=> console.log(`Backend running on port ${PORT}`));
