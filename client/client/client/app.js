// 👉 Replace this with your Render backend URL
const API_ROOT = https://tic-tac-rewards-2.onrender.com

let user = null;
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";

// Register user
function register() {
  const username = document.getElementById("reg-username").value;
  const email = document.getElementById("reg-email").value;
  fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email })
  }).then(res => res.json()).then(data => {
    user = data.user;
    alert("Registered! Now login.");
  }).catch(err => alert("Error: " + err));
}

// Login user
function login() {
  const email = document.getElementById("login-email").value;
  fetch(`${API_ROOT}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  }).then(res => res.json()).then(data => {
    if (data.user) {
      user = data.user;
      document.getElementById("login-section").style.display = "none";
      document.getElementById("register-section").style.display = "none";
      document.getElementById("game-section").style.display = "block";
      renderBoard();
    } else {
      alert("User not found, please register first.");
    }
  }).catch(err => alert("Error: " + err));
}

// Render game board
function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = cell;
    div.onclick = () => makeMove(i);
    boardDiv.appendChild(div);
  });

  document.getElementById("status").innerText =
    "Current Player: " + currentPlayer;
}

// Handle moves
function makeMove(i) {
  if (board[i] === "" && user) {
    board[i] = currentPlayer;
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    renderBoard();
    checkWinner();
  }
}

// Check winner
function checkWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      document.getElementById("status").innerText =
        `Player ${board[a]} wins! 🎉`;
      return true;
    }
  }
  return false;
}

// Restart game
function restartGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  renderBoard();
}

// Demo reward simulation
function simulateWin() {
  if (!user) {
    alert("Login first!");
    return;
  }
  fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email })
  }).then(res => res.json()).then(data => {
    alert("You won ₦400! Balance: ₦" + data.user.balance);
  }).catch(err => alert("Error: " + err));
}

// Upgrade (Paystack placeholder)
function upgrade() {
  alert("👉 In real mode this will open Paystack checkout!");
}

// Withdraw (Paystack placeholder)
function withdraw() {
  if (!user) {
    alert("Login first!");
    return;
  }
  alert("👉 In real mode this will send money to your bank via Paystack!");
}
