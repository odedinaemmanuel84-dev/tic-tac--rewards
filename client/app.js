// script.js

// ======= CONFIG =======
const API_ROOT = "https://tic-tac-rewards-1.onrender.com/api"; // replace with your backend URL

// ======= UI ELEMENTS =======
const authSection = document.getElementById("authSection");
const gameSection = document.getElementById("gameSection");
const authForm = document.getElementById("authForm");
const toggleAuthBtn = document.getElementById("toggleAuth");
const logoutBtn = document.getElementById("logoutBtn");
const statusText = document.getElementById("status");

// Game board
const board = document.getElementById("board");
const cells = document.querySelectorAll(".cell");
const restartBtn = document.getElementById("restartBtn");
const modeSelect = document.getElementById("mode");

// ======= STATE =======
let isLoginMode = true;
let currentPlayer = "X";
let gameActive = true;
let gameMode = "ai"; // ai | offline
let boardState = Array(9).fill("");

// ======= AUTH HANDLING =======

// Switch between register & login
toggleAuthBtn.addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  authForm.querySelector("button").textContent = isLoginMode ? "Login" : "Register";
  toggleAuthBtn.textContent = isLoginMode ? "Need an account? Register" : "Have an account? Login";
});

// Submit register/login
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    const endpoint = isLoginMode ? "/auth/login" : "/auth/register";
    const res = await fetch(API_ROOT + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error");

    if (isLoginMode) {
      // Save token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      loadGame();
    } else {
      alert("Registration successful, now login!");
      isLoginMode = true;
      authForm.querySelector("button").textContent = "Login";
      toggleAuthBtn.textContent = "Need an account? Register";
    }
  } catch (err) {
    alert(err.message);
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  authSection.style.display = "block";
  gameSection.style.display = "none";
});

// Auto-login if token exists
if (localStorage.getItem("token")) {
  loadGame();
}

// ======= GAME LOGIC =======
function loadGame() {
  authSection.style.display = "none";
  gameSection.style.display = "block";
  resetGame();
}

// Handle cell clicks
cells.forEach((cell, idx) => {
  cell.addEventListener("click", () => handleCellClick(idx));
});

function handleCellClick(index) {
  if (!gameActive || boardState[index] !== "") return;

  boardState[index] = currentPlayer;
  cells[index].textContent = currentPlayer;

  if (checkWinner()) {
    statusText.textContent = `${currentPlayer} Wins!`;
    gameActive = false;
    return;
  }

  if (!boardState.includes("")) {
    statusText.textContent = "It's a Draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";

  if (gameMode === "ai" && currentPlayer === "O") {
    setTimeout(aiMove, 500);
  }
}

// Simple AI (random move)
function aiMove() {
  let emptyCells = boardState
    .map((val, idx) => (val === "" ? idx : null))
    .filter((v) => v !== null);

  let move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  handleCellClick(move);
}

// Check winner
function checkWinner() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];

  return winPatterns.some(pattern =>
    pattern.every(idx => boardState[idx] === currentPlayer)
  );
}

// Restart game
restartBtn.addEventListener("click", resetGame);

function resetGame() {
  currentPlayer = "X";
  gameActive = true;
  boardState.fill("");
  cells.forEach(cell => (cell.textContent = ""));
  statusText.textContent = "Your turn!";
}

// Change mode
modeSelect.addEventListener("change", (e) => {
  gameMode = e.target.value;
  resetGame();
});
