const API_ROOT = https://tic-tac-rewards-2.onrender.com/

let currentPlayer = "X";
let board = ["", "", "", "", "", "", "", "", ""];
let user = null;
let mode = "demo"; // demo or premium
let reward = 0;

// 🔊 Sounds
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const drawSound = document.getElementById("drawSound");
const bgMusic = document.getElementById("bgMusic");

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
    document.getElementById("mode").classList.remove("hidden");
  } else {
    alert(data.error);
  }
}

// Start Demo Mode
function startDemo() {
  mode = "demo";
  reward = 400;
  document.getElementById("mode").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("welcomeMsg").innerText = `Welcome, ${user.username}!`;
  document.getElementById("modeInfo").innerText = `Mode: Demo (₦500 deposit → ₦${reward} reward)`;
  bgMusic.play();
  renderBoard();
}

// Start Premium Mode
function startPremium() {
  mode = "premium";
  let deposit = prompt("Enter deposit amount (₦500 - ₦5000):", "500");
  deposit = parseInt(deposit);

  if (isNaN(deposit) || deposit < 500 || deposit > 5000) {
    alert("Invalid deposit! Please enter between ₦500 and ₦5000.");
    return;
  }

  reward = Math.floor(deposit * 0.9); // e.g. 90% reward
  document.getElementById("mode").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("welcomeMsg").innerText = `Welcome, ${user.username}!`;
  document.getElementById("modeInfo").innerText = `Mode: Premium (Deposit ₦${deposit} → Reward ₦${reward})`;
  bgMusic.play();
  renderBoard();
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
  if (board[index] === "" && !checkWinner(true)) {
    board[index] = currentPlayer;
    clickSound.play();
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    renderBoard();
    checkWinner();
  }
}

// Check for winner
function checkWinner(quiet = false) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const combo of combos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      document.getElementById("status").innerText = `${board[a]} wins! 🎉 Reward: ₦${reward}`;
      if (!quiet) winSound.play();
      return true;
    }
  }

  if (!board.includes("")) {
    document.getElementById("status").innerText = "It's a draw!";
    if (!quiet) drawSound.play();
    return true;
  }

  return false;
}

// Reset
function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  document.getElementById("status").innerText = "";
  renderBoard();
}

// End game
function endGame() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
  document.getElementById("game").classList.add("hidden");
  document.getElementById("mode").classList.remove("hidden");
  }
