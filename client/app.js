// =============================
// 1. API Root
// =============================
const API_ROOT = "https://tic-tac-rewards-1.onrender.com"; // <-- replace with your Render backend URL

// =============================
// 2. UI Elements
// =============================
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const gameBoard = document.getElementById("board");
const statusText = document.getElementById("status");
const musicToggle = document.getElementById("music-toggle");

// =============================
// 3. Game State
// =============================
let currentPlayer = "X";
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = false;
let vsAI = true; // default: play vs AI
let token = localStorage.getItem("token") || null;

// =============================
// 4. Sounds & Music
// =============================
const clickSound = new Audio("sounds/click.mp3");
const winSound = new Audio("sounds/win.mp3");
const bgMusic = new Audio("sounds/music.mp3");
bgMusic.loop = true;

// toggle music
musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicToggle.textContent = "🔊 Music On";
  } else {
    bgMusic.pause();
    musicToggle.textContent = "🔈 Music Off";
  }
});

// =============================
// 5. Auth Functions
// =============================
async function registerUser(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const res = await fetch(`${API_ROOT}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Registration successful! Now login.");
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}

async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_ROOT}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem("token", token);
      alert("✅ Login successful!");
      startGame();
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}

function logoutUser() {
  token = null;
  localStorage.removeItem("token");
  alert("👋 Logged out!");
  resetGame();
}

// =============================
// 6. Game Logic
// =============================
function startGame() {
  gameActive = true;
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  renderBoard();
  statusText.textContent = "Player X's turn";
}

function renderBoard() {
  gameBoard.innerHTML = "";
  board.forEach((cell, idx) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.dataset.index = idx;
    div.textContent = cell;
    div.addEventListener("click", handleCellClick);
    gameBoard.appendChild(div);
  });
}

function handleCellClick(e) {
  const idx = e.target.dataset.index;
  if (!gameActive || board[idx] !== "") return;

  board[idx] = currentPlayer;
  clickSound.play();
  renderBoard();

  if (checkWin()) {
    statusText.textContent = `🎉 Player ${currentPlayer} wins!`;
    winSound.play();
    gameActive = false;
    return;
  }

  if (!board.includes("")) {
    statusText.textContent = "🤝 It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.textContent = `Player ${currentPlayer}'s turn`;

  if (vsAI && currentPlayer === "O" && gameActive) {
    setTimeout(aiMove, 500);
  }
}

function aiMove() {
  const available = board
    .map((val, idx) => (val === "" ? idx : null))
    .filter((v) => v !== null);
  const move = available[Math.floor(Math.random() * available.length)];
  board[move] = "O";
  clickSound.play();
  renderBoard();

  if (checkWin()) {
    statusText.textContent = "🤖 AI wins!";
    winSound.play();
    gameActive = false;
    return;
  }

  if (!board.includes("")) {
    statusText.textContent = "🤝 It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = "X";
  statusText.textContent = "Player X's turn";
}

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

  return winPatterns.some((pattern) => {
    const [a, b, c] = pattern;
    return board[a] && board[a] === board[b] && board[a] === board[c];
  });
}

function resetGame() {
  gameActive = false;
  board = ["", "", "", "", "", "", "", "", ""];
  gameBoard.innerHTML = "";
  statusText.textContent = "Login or Register to start!";
}

// =============================
// 7. Event Listeners
// =============================
if (registerForm) registerForm.addEventListener("submit", registerUser);
if (loginForm) loginForm.addEventListener("submit", loginUser);
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

// auto start if already logged in
if (token) {
  startGame();
  }
