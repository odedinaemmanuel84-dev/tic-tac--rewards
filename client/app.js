const backendUrl = "https://your-app.onrender.com"; // 🔴 Replace with your Render backend URL
let token = localStorage.getItem("token") || null;

// ===== AUTH =====
async function register() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch(`${backendUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  alert(data.message || "Registered!");
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${backendUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    alert("Login successful!");

    document.querySelector(".auth-container").classList.add("hidden");
    document.querySelector(".game-container").classList.remove("hidden");
  } else {
    alert(data.message || "Login failed");
  }
}

function logout() {
  token = null;
  localStorage.removeItem("token");
  document.querySelector(".auth-container").classList.remove("hidden");
  document.querySelector(".game-container").classList.add("hidden");
  alert("Logged out!");
}

// ===== GAME =====
let currentPlayer = "X";
let board = Array(9).fill(null);

const gameBoard = document.getElementById("game-board");
const statusText = document.getElementById("status");

function createBoard() {
  gameBoard.innerHTML = "";
  board.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell || "";
    div.addEventListener("click", () => makeMove(index));
    gameBoard.appendChild(div);
  });
  statusText.textContent = `Player ${currentPlayer}'s turn`;
}

function makeMove(index) {
  if (board[index] || checkWinner()) return;
  board[index] = currentPlayer;
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  createBoard();

  const winner = checkWinner();
  if (winner) {
    statusText.textContent = `🎉 Player ${winner} wins!`;
  } else if (board.every(cell => cell)) {
    statusText.textContent = "It's a draw!";
  }
}

function checkWinner() {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function resetGame() {
  currentPlayer = "X";
  board = Array(9).fill(null);
  createBoard();
}

createBoard();
