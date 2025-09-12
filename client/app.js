// 🔗 Replace with your Render backend URL
const SERVER_URL = https://tic-tac-rewards-1.onrender.com

// 🎵 Sounds
const moveSound = new Audio("https://www.fesliyanstudios.com/play-mp3/387");
const winSound = new Audio("https://www.fesliyanstudios.com/play-mp3/438");

// 🎮 Game setup
const board = document.getElementById("game-board");
let currentPlayer = "X";
let cells = Array(9).fill(null);
let againstAI = false;

// Create the board
function createBoard() {
  board.innerHTML = "";
  cells = Array(9).fill(null);
  currentPlayer = "X";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleMove);
    board.appendChild(cell);
  }
}

function handleMove(e) {
  const index = e.target.dataset.index;
  if (!cells[index]) {
    cells[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    moveSound.play();

    if (checkWinner()) {
      winSound.play();
      setTimeout(() => alert(`${currentPlayer} wins!`), 200);
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";

    if (againstAI && currentPlayer === "O") {
      setTimeout(aiMove, 500);
    }
  }
}

function aiMove() {
  const emptyCells = cells.map((val, i) => (val ? null : i)).filter(i => i !== null);
  if (emptyCells.length === 0) return;
  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const cellElement = document.querySelector(`[data-index='${randomIndex}']`);
  cellElement.click();
}

function checkWinner() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(pattern => {
    const [a,b,c] = pattern;
    return cells[a] && cells[a] === cells[b] && cells[a] === cells[c];
  });
}

// 💸 Payments
async function payAndPlay(amount) {
  const email = prompt("Enter your email to play:");
  if (!email) return;

  try {
    const response = await fetch(`${SERVER_URL}/api/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount })
    });

    const data = await response.json();
    console.log("Payment init:", data);

    if (data.status === true) {
      window.location.href = data.data.authorization_url;
    } else {
      alert("Payment failed, try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}

// 🎮 Demo & Premium
function startDemo() {
  payAndPlay(500); // fixed ₦500
}

function startPremium() {
  const amount = parseInt(prompt("Enter amount between 500 – 5000:"), 10);
  if (isNaN(amount) || amount < 500 || amount > 5000) {
    alert("Invalid amount!");
    return;
  }
  payAndPlay(amount);
}

// Load first board
createBoard();
