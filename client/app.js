const backendURL = "https://tic-tac-rewards-1.onrender.com";

let currentPlayer = "X";
let board = Array(9).fill(null);
let isGameActive = false;
let mode = "ai";
let aiLevel = "easy";
let userToken = null;

const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const xWinsEl = document.getElementById("xWins");
const oWinsEl = document.getElementById("oWins");
const drawsEl = document.getElementById("draws");

const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");
const bgMusic = document.getElementById("bgMusic");

// ================= AUTH =================
async function registerUser() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch(`${backendURL}/api/auth/register`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  alert(data.message || "Registered");
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${backendURL}/api/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (data.token) {
    userToken = data.token;
    localStorage.setItem("token", userToken);
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("gameSection").classList.remove("hidden");
    document.getElementById("logoutBtn").style.display = "inline-block";
    document.getElementById("welcomeText").innerText = `Welcome, ${email}`;
  } else {
    alert(data.message || "Login failed");
  }
}

function logoutUser() {
  userToken = null;
  localStorage.removeItem("token");
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("logoutBtn").style.display = "none";
}

// ================= GAME =================
function startGame() {
  board = Array(9).fill(null);
  boardElement.innerHTML = "";
  isGameActive = true;
  currentPlayer = "X";
  mode = document.getElementById("modeSelect").value;
  aiLevel = document.getElementById("aiLevel").value;
  statusElement.innerText = "Player X's turn";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
    boardElement.appendChild(cell);
  }
}

function handleCellClick(e) {
  const index = e.target.dataset.index;
  if (!isGameActive || board[index]) return;

  board[index] = currentPlayer;
  e.target.innerText = currentPlayer;
  moveSound.play();

  if (checkWinner()) return;

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusElement.innerText = `Player ${currentPlayer}'s turn`;

  if (mode === "ai" && currentPlayer === "O") {
    setTimeout(aiMove, 500);
  }
}

function aiMove() {
  let move;
  if (aiLevel === "easy") {
    const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
    move = empty[Math.floor(Math.random() * empty.length)];
  } else if (aiLevel === "medium") {
    move = findWinningMove("O") || findWinningMove("X") || randomMove();
  } else {
    move = minimax(board, "O").index;
  }

  const cell = boardElement.children[move];
  cell.click();
}

function findWinningMove(player) {
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player;
      if (checkWin(player)) { board[i] = null; return i; }
      board[i] = null;
    }
  }
  return null;
}

function randomMove() {
  const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function minimax(newBoard, player) {
  const availSpots = newBoard.map((v,i)=>v?null:i).filter(v=>v!==null);
  if (checkWin("X", newBoard)) return {score:-10};
  if (checkWin("O", newBoard)) return {score:10};
  if (availSpots.length === 0) return {score:0};

  const moves = [];
  for (let i=0; i<availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    const result = minimax(newBoard, player==="O"?"X":"O");
    move.score = result.score;

    newBoard[availSpots[i]] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -1000;
    moves.forEach((m,i)=>{if(m.score>bestScore){bestScore=m.score;bestMove=i;}});
  } else {
    let bestScore = 1000;
    moves.forEach((m,i)=>{if(m.score<bestScore){bestScore=m.score;bestMove=i;}});
  }
  return moves[bestMove];
}

function checkWinner() {
  if (checkWin(currentPlayer)) {
    statusElement.innerText = `Player ${currentPlayer} Wins!`;
    updateScore(currentPlayer);
    isGameActive = false;
    winSound.play();
    return true;
  }
  if (!board.includes(null)) {
    statusElement.innerText = "It's a Draw!";
    drawsEl.innerText = parseInt(drawsEl.innerText) + 1;
    isGameActive = false;
    return true;
  }
  return false;
}

function checkWin(player, customBoard=board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return combos.some(combo => combo.every(i => customBoard[i]===player));
}

function updateScore(player) {
  if (player === "X") {
    xWinsEl.innerText = parseInt(xWinsEl.innerText) + 1;
  } else {
    oWinsEl.innerText = parseInt(oWinsEl.innerText) + 1;
  }
}

// ================= UI NAVIGATION =================
document.getElementById("registerBtn").onclick = () => {
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
};

document.getElementById("loginBtn").onclick = () => {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
};

document.getElementById("logoutBtn").onclick = logoutUser;

document.getElementById("toggleSound").onclick = () => {
  if (bgMusic.paused) bgMusic.play();
  else bgMusic.pause();
};
