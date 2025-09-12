const API_ROOT = https://tic-tac-rewards-1.onrender.com
let userId = null;

// Register
document.getElementById("register").onclick = async () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });
  const data = await res.json();
  userId = data.id;
  document.getElementById("status").innerText = "Registered as " + data.name;
};

// Play
document.getElementById("play").onclick = async () => {
  const res = await fetch(`${API_ROOT}/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  document.getElementById("status").innerText = data.message;
};

// Win
document.getElementById("win").onclick = async () => {
  const res = await fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, reward: 400 })
  });
  const data = await res.json();
  document.getElementById("status").innerText = "Balance: " + data.balance;
};

// Upgrade
document.getElementById("upgrade").onclick = async () => {
  const res = await fetch(`${API_ROOT}/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount: 500, currency: "NGN" })
  });
  const data = await res.json();
  document.getElementById("status").innerText = data.message || "Upgraded";
};

// Withdraw
document.getElementById("withdraw").onclick = async () => {
  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, bankCode: "058", accountNumber: "1234567890", amount: 400 })
  });
  const data = await res.json();
  document.getElementById("status").innerText = data.message;
};
