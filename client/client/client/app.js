// 👇 Set your backend API root here
const API_ROOT = https://tic-tac-rewards-2.onrender.com

// ==========================
// Auth & User Functions
// ==========================

// Register user
async function register(username, email) {
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email }),
  });
  return res.json();
}

// Login user
async function login(email) {
  const res = await fetch(`${API_ROOT}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// Record a win → +₦400
async function recordWin(email) {
  const res = await fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// Withdraw money
async function withdraw(email) {
  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// Upgrade to premium
async function upgrade(email, amount) {
  const res = await fetch(`${API_ROOT}/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount }),
  });
  return res.json();
}

// ==========================
// Example Usage (UI Buttons)
// ==========================

// Call these inside your game UI logic
document.getElementById("registerBtn").onclick = async () => {
  let username = prompt("Enter username:");
  let email = prompt("Enter email:");
  let result = await register(username, email);
  console.log(result);
  alert(result.message || result.error);
};

document.getElementById("loginBtn").onclick = async () => {
  let email = prompt("Enter email:");
  let result = await login(email);
  console.log(result);
  alert(result.message || result.error);
};

document.getElementById("winBtn").onclick = async () => {
  let email = prompt("Enter email:");
  let result = await recordWin(email);
  console.log(result);
  alert(result.message || result.error);
};

document.getElementById("withdrawBtn").onclick = async () => {
  let email = prompt("Enter email:");
  let result = await withdraw(email);
  console.log(result);
  alert(result.message || result.error);
};

document.getElementById("upgradeBtn").onclick = async () => {
  let email = prompt("Enter email:");
  let amount = parseInt(prompt("Enter amount (min ₦500):"), 10);
  let result = await upgrade(email, amount);
  console.log(result);
  alert(result.message || result.error);
};
