const API_ROOT = "https://tic-tac-rewards-1.onrender.com"; // replace with your backend

// DOM elements
const authForm = document.getElementById("authForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const gameContainer = document.getElementById("gameContainer");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");

// ---------------- AUTH ----------------
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_ROOT}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    loadGame();
  } else {
    alert(data.message || "Login failed");
  }
});

registerBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_ROOT}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    loadGame();
  } else {
    alert(data.message || "Registration failed");
  }
});

function loadGame() {
  authForm.style.display = "none";
  gameContainer.style.display = "block";
  resetGame();
}

function logout() {
  localStorage.removeItem("token");
  gameContainer.style.display = "none";
  authForm.style.display = "block";
}

// ---------------- TIC TAC TOE ----------------
let board = Array(9).fill(null);
let currentPlayer = "X";
let gameActive = true;
let mode = "multiplayer"; // default

function setMode(m) {
  mode = m;
  resetGame();
}

function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameActive = true;
  statusElement.textContent = "Player X's turn";
  renderBoard();
}

function renderBoard() {
  boardElement.innerHTML = "";
  board.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell || "";
    div.addEventListener("click", () => handleCellClick(index));
    boardElement.appendChild(div);
  });
}

function handleCellClick(index) {
  if (!gameActive || board[index]) return;

  board[index] = currentPlayer;
  renderBoard();

  if (checkWin(currentPlayer)) {
    statusElement.textContent = `Player ${currentPlayer} wins!`;
    gameActive = false;
    return;
  } else if (board.every(cell => cell)) {
    statusElement.textContent = "It's a draw!";
    gameActive = false;
    return;
  }

  if (mode === "multiplayer") {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusElement.textContent = `Player ${currentPlayer}'s turn`;
  } else if (mode === "ai") {
    currentPlayer = "O"; // AI is O
    aiMove();
  }
}

function aiMove() {
  if (!gameActive) return;
  const available = board.map((v, i) => v ? null : i).filter(v => v !== null);
  const choice = available[Math.floor(Math.random() * available.length)];
  board[choice] = "O";
  renderBoard();

  if (checkWin("O")) {
    statusElement.textContent = "AI wins!";
    gameActive = false;
    return;
  } else if (board.every(cell => cell)) {
    statusElement.textContent = "It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = "X";
  statusElement.textContent = "Player X's turn";
}

function checkWin(player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(pattern =>
    pattern.every(index => board[index] === player)
  );
}
