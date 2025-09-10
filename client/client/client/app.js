// 🌍 Replace with your real Render backend URL
const API_ROOT = https://tic-tac-rewards-2.onrender.com/

// ---------------- Game Variables ----------------
let currentUser = null;
let currentPlayer = "X";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

// 🎵 Sound
const clickSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// ---------------- Helper Functions ----------------
function showMessage(msg) {
  document.getElementById("message").innerText = msg;
}

// ---------------- Auth Functions ----------------
async function registerUser(name, email) {
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const data = await res.json();
  currentUser = { email, ...data.user };
  showMessage(`Welcome ${currentUser.name}! Mode: ${currentUser.tier}`);
}

// ---------------- Upgrade ----------------
async function upgradeToPremium(amount) {
  if (!currentUser) return alert("Please register first");

  const res = await fetch(`${API_ROOT}/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, amount }),
  });

  const data = await res.json();
  if (data.authorization_url) {
    window.location.href = data.authorization_url; // Open Paystack checkout
  } else {
    alert("Upgrade failed");
  }
}

// ---------------- Withdraw ----------------
async function withdrawMoney() {
  if (!currentUser) return alert("Please register first");

  const account_number = prompt("Enter your bank account number:");
  const bank_code = prompt("Enter your bank code (e.g., 058 for GTB):");

  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, account_number, bank_code }),
  });

  const data = await res.json();
  alert(data.message || "Withdrawal request sent");
}

// ---------------- Game Logic ----------------
function checkWin() {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
      gameActive = false;
      winSound.play();
      showMessage(`${currentPlayer} wins!`);

      if (currentUser) reportWin(currentUser.email);
      return;
    }
  }

  if (!gameState.includes("")) {
    gameActive = false;
    showMessage("Draw!");
  }
}

async function reportWin(email) {
  await fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

// ---------------- Event Listeners ----------------
document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, i) => {
    cell.addEventListener("click", () => {
      if (!gameActive || gameState[i]) return;

      gameState[i] = currentPlayer;
      cell.innerText = currentPlayer;
      clickSound.play();
      checkWin();

      currentPlayer = currentPlayer === "X" ? "O" : "X";
    });
  });

  document.getElementById("registerBtn").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    registerUser(name, email);
  });

  document.getElementById("upgradeBtn").addEventListener("click", () => {
    const amount = prompt("Enter upgrade amount (500, 1000, or 5000):");
    upgradeToPremium(Number(amount));
  });

  document.getElementById("withdrawBtn").addEventListener("click", () => {
    withdrawMoney();
  });
});
