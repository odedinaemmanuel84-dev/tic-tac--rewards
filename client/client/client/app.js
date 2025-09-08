// Connect frontend to backend
const API_ROOT = https://tic-tac-rewards-2.onrender.com

let currentPlayer = "X";
let board = ["", "", "", "", "", "", "", "", ""];
let user = null;

// Register
async function registerUser() {
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;

  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email })
  });

  const data = await res.json();
  alert(data.message || data.error);
}

// Login
async function loginUser() {
  const email = document.getElementById("loginEmail").value;

  const res = await fetch(`${API_ROOT}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (data.user) {
    user = data.user;
    document.getElementById("auth").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("welcomeMsg").innerText = `Welcome, ${user.username}!`;
    renderBoard();
  } else {
    alert(data.error);
  }
}

// Render game board
function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.innerText = cell;
    div.onclick = () => makeMove(i);
    boardDiv.appendChild(div);
  });
}

// Handle moves
function makeMove(index) {
  if (board[index] === "") {
    board[index] = currentPlayer;
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    renderBoard();
    checkWinner();
  }
}

// Check for winner
function checkWinner() {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const combo of combos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      document.getElementById("status").innerText = `${board[a]} wins! 🎉`;
      return;
    }
  }

  if (!board.includes("")) {
    document.getElementById("status").innerText = "It's a draw!";
  }
}

// Reset
function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  document.getElementById("status").innerText = "";
  renderBoard();
}
