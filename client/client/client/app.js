// 👇 Replace with your actual Render backend URL
const API_ROOT = https://tic-tac-rewards-2.onrender.com

let currentUser = null;

// ==========================
// API Calls
// ==========================
async function register(username, email) {
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email }),
  });
  return res.json();
}

async function login(email) {
  const res = await fetch(`${API_ROOT}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

async function recordWin(email) {
  const res = await fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

async function withdraw(email) {
  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

async function upgrade(email, amount) {
  const res = await fetch(`${API_ROOT}/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount }),
  });
  return res.json();
}

// ==========================
// UI Logic
// ==========================

document.getElementById("registerBtn").onclick = async () => {
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  let result = await register(username, email);
  alert(result.message || result.error);
};

document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  let result = await login(email);
  if (result.user) {
    currentUser = result.user;
    document.getElementById("game").style.display = "block";
    document.getElementById("rewards").style.display = "block";
    updateBalance();
  }
  alert(result.message || result.error);
};

document.getElementById("winBtn").onclick = async () => {
  if (!currentUser) return alert("Login first!");
  let result = await recordWin(currentUser.email);
  if (result.user) currentUser = result.user;
  updateBalance();
  alert(result.message || result.error);
};

document.getElementById("withdrawBtn").onclick = async () => {
  if (!currentUser) return alert("Login first!");
  let result = await withdraw(currentUser.email);
  if (result.user) currentUser = result.user;
  updateBalance();
  alert(result.message || result.error);
};

document.getElementById("upgradeBtn").onclick = async () => {
  if (!currentUser) return alert("Login first!");
  let amount = parseInt(prompt("Enter upgrade amount (min ₦500):"), 10);
  let result = await upgrade(currentUser.email, amount);
  if (result.user) currentUser = result.user;
  updateBalance();
  alert(result.message || result.error);
};

// ==========================
// Game Board Logic
// ==========================
const boardEl = document.getElementById("board");
let cells = [];
let turn = "X";

function createBoard() {
  boardEl.innerHTML = "";
  cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(cell, i));
    boardEl.appendChild(cell);
    cells.push("");
  }
  turn = "X";
  document.getElementById("status").textContent = "Your turn (X)";
}

function makeMove(cell, index) {
  if (cells[index] !== "") return;
  cells[index] = turn;
  cell.textContent = turn;
  cell.classList.add("taken");

  if (checkWin(turn)) {
    document.getElementById("status").textContent = `${turn} wins!`;
    if (turn === "X" && currentUser) {
      recordWin(currentUser.email);
    }
    return;
  }

  turn = turn === "X" ? "O" : "X";
  document.getElementById("status").textContent = `Turn: ${turn}`;
}

function checkWin(player) {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8], 
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winCombos.some(combo => combo.every(i => cells[i] === player));
}

document.getElementById("restartBtn").onclick = createBoard;

// Start with empty board
createBoard();

// ==========================
// Balance Display
// ==========================
function updateBalance() {
  document.getElementById("balance").textContent = 
    `Balance: ₦${currentUser.balance || 0} (Plan: ${currentUser.plan})`;
    }
