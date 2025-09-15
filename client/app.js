const API_ROOT = "https://tic-tac-rewards-1.onrender.com";
let token = localStorage.getItem("token") || null;

// Sections
const authSection = document.getElementById("auth-section");
const modeSection = document.getElementById("mode-section");
const gameSection = document.getElementById("game-section");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const statusDiv = document.getElementById("status");
const boardDiv = document.getElementById("board");
const logoutBtn = document.getElementById("logout-btn");
const backBtn = document.getElementById("back-btn");

// Tabs
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");

// Sounds
const bgMusic = document.getElementById("bg-music");
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const soundToggle = document.getElementById("sound-toggle");

let musicPlaying = false;
soundToggle.addEventListener("click", () => {
  if (musicPlaying) {
    bgMusic.pause();
    soundToggle.textContent = "🔇";
  } else {
    bgMusic.play();
    soundToggle.textContent = "🔊";
  }
  musicPlaying = !musicPlaying;
});

// Tabs
loginTab.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
});
registerTab.addEventListener("click", () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
});

// Auto login
window.addEventListener("DOMContentLoaded", () => {
  if (token) {
    authSection.classList.add("hidden");
    modeSection.classList.remove("hidden");
    bgMusic.play();
    musicPlaying = true;
    soundToggle.textContent = "🔊";
  }
});

// Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const res = await fetch(`${API_ROOT}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (res.ok) {
    alert("✅ Registration successful! Please login.");
    registerForm.reset();
    loginTab.click();
  } else {
    alert("❌ " + data.message);
  }
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

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
    authSection.classList.add("hidden");
    modeSection.classList.remove("hidden");
    bgMusic.play();
    musicPlaying = true;
    soundToggle.textContent = "🔊";
  } else {
    alert("❌ " + data.message);
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  token = null;
  localStorage.removeItem("token");
  authSection.classList.remove("hidden");
  modeSection.classList.add("hidden");
  gameSection.classList.add("hidden");
  resetGame();
  bgMusic.pause();
  musicPlaying = false;
  soundToggle.textContent = "🔇";
});

// Back button
backBtn.addEventListener("click", () => {
  gameSection.classList.add("hidden");
  modeSection.classList.remove("hidden");
  resetGame();
});

// Game logic
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let gameMode = "multiplayer"; // default

// Mode selection
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    gameMode = btn.dataset.mode;
    modeSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    startGame();
  });
});

function startGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  statusDiv.textContent = "Player X's turn";
  boardDiv.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
    boardDiv.appendChild(cell);
  }
}

function handleCellClick(e) {
  const index = e.target.dataset.index;
  if (board[index] !== "" || !gameActive) return;

  board[index] = currentPlayer;
  e.target.textContent = currentPlayer;
  moveSound.play();

  if (checkWin()) {
    statusDiv.textContent = `🎉 Player ${currentPlayer} wins!`;
    winSound.play();
    gameActive = false;
    return;
  }
  if (!board.includes("")) {
    statusDiv.textContent = "😮 It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusDiv.textContent = `Player ${currentPlayer}'s turn`;

  // AI Turn
  if ((gameMode === "ai-easy" || gameMode === "ai-hard") && currentPlayer === "O") {
    setTimeout(aiMove, 500);
  }
}

function aiMove() {
  let index;
  if (gameMode === "ai-easy") {
    // Random move
    const available = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    index = available[Math.floor(Math.random() * available.length)];
  } else {
    // Hard mode (minimax)
    index = minimax(board, "O").index;
  }

  board[index] = "O";
  const cell = document.querySelector(`[data-index='${index}']`);
  cell.textContent = "O";
  moveSound.play();

  if (checkWin()) {
    statusDiv.textContent = "🤖 AI wins!";
    winSound.play();
    gameActive = false;
    return;
  }
  if (!board.includes("")) {
    statusDiv.textContent = "😮 It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = "X";
  statusDiv.textContent = `Player X's turn`;
}

// Minimax for hard AI
function minimax(newBoard, player) {
  const availSpots = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);

  if (winning(newBoard, "X")) return { score: -10 };
  else if (winning(newBoard, "O")) return { score: 10 };
  else if (availSpots.length === 0) return { score: 0 };

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[availSpots[i]] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = 10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function winning(b, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(p => p.every(idx => b[idx] === player));
}

function checkWin() {
  return winning(board, currentPlayer);
}

function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  boardDiv.innerHTML = "";
  statusDiv.textContent = "Login or Register to start!";
                              }
