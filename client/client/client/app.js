// ==============================
// Tic-Tac-Toe Frontend (app.js)
// ==============================

// 👇 CHANGE this to your Render backend URL
const API_ROOT = https://tic-tac-rewards-2.onrender.com

// Store player info after registration
let currentPlayer = null;

// ========== Register ==========
async function registerPlayer(name, email) {
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });
  const data = await res.json();
  currentPlayer = data.player;
  alert("Registered successfully! ID: " + currentPlayer.id);
}

// ========== Play Demo ==========
async function playDemo() {
  if (!currentPlayer) return alert("Register first!");

  const res = await fetch(`${API_ROOT}/demo/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId: currentPlayer.id })
  });
  const data = await res.json();
  alert(data.message);
}

// ========== Upgrade (Paystack) ==========
async function upgradePlayer(amount) {
  if (!currentPlayer) return alert("Register first!");

  const res = await fetch(`${API_ROOT}/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId: currentPlayer.id, amount })
  });
  const data = await res.json();

  if (data.authorization_url) {
    // Redirect to Paystack Checkout
    window.location.href = data.authorization_url;
  } else {
    alert(data.message || "Upgrade failed");
  }
}

// ========== Withdraw ==========
async function withdraw(bankCode, accountNumber, amount) {
  if (!currentPlayer) return alert("Register first!");

  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: currentPlayer.id,
      bankCode,
      accountNumber,
      amount
    })
  });
  const data = await res.json();
  alert(data.message || JSON.stringify(data));
}

// ========== Simple UI Bindings ==========
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerBtn").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value;
    const email = document.getElementById("emailInput").value;
    registerPlayer(name, email);
  });

  document.getElementById("demoBtn").addEventListener("click", () => {
    playDemo();
  });

  document.getElementById("upgradeBtn").addEventListener("click", () => {
    const amount = parseInt(prompt("Enter upgrade amount (500 - 5000):"), 10);
    if (amount >= 500 && amount <= 5000) {
      upgradePlayer(amount);
    } else {
      alert("Amount must be between 500 and 5000");
    }
  });

  document.getElementById("withdrawBtn").addEventListener("click", () => {
    const bankCode = prompt("Enter bank code (e.g. 058 for GTBank):");
    const accountNumber = prompt("Enter your account number:");
    const amount = parseInt(prompt("Enter amount to withdraw:"), 10);
    withdraw(bankCode, accountNumber, amount);
  });
});
