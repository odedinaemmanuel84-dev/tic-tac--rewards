const API_ROOT = "https://your-backend-name.onrender.com"; // Replace with your Render URL

let currentUser = null;
let boardState = Array(9).fill("");
let currentTurn = "X"; // Player is always X
let aiEnabled = true; // AI opponent enabled

// --- Sound effects ---
const clickSound = new Audio("click.mp3");
const winSound = new Audio("win.mp3");

// --- AUTH FUNCTIONS ---
// Register new user
async function registerUser() {
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    if (!name || !email) return alert("Enter name & email!");

    const res = await fetch(`${API_ROOT}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
    });
    currentUser = await res.json();
    startGame();
}

// Login existing user
async function loginUser() {
    const email = document.getElementById("login-email").value;
    if (!email) return alert("Enter email!");
    // Backend returns user if exists
    const res = await fetch(`${API_ROOT}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email })
    });
    currentUser = await res.json();
    startGame();
}

// Logout
function logout() {
    currentUser = null;
    boardState = Array(9).fill("");
    document.getElementById("game-card").style.display = "none";
    document.getElementById("auth-card").style.display = "flex";
}

// --- GAME FUNCTIONS ---
function startGame() {
    document.getElementById("auth-card").style.display = "none";
    document.getElementById("game-card").style.display = "block";
    updateUserInfo();
    drawBoard();
}

function updateUserInfo() {
    document.getElementById("user-name").innerText = currentUser.name || "Guest";
    document.getElementById("user-balance").innerText = `Balance: ₦${currentUser.balance}`;
    document.getElementById("user-plays").innerText = `Plays Left: ${currentUser.playsLeft}`;
    document.getElementById("user-premium").innerText = `Premium: ${currentUser.premium}`;
}

// Draw Tic-Tac-Toe board
function drawBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";
    boardState.forEach((val, i) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = val;
        cell.addEventListener("click", () => playerMove(i));
        board.appendChild(cell);
    });
}

// Player makes a move
function playerMove(i) {
    if (boardState[i] !== "") return;
    boardState[i] = "X";
    clickSound.play();
    if (checkWin("X")) return;
    if (aiEnabled) setTimeout(aiMove, 300);
}

// AI makes a move
function aiMove() {
    let empty = boardState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    if (empty.length === 0) return;
    const choice = empty[Math.floor(Math.random() * empty.length)];
    boardState[choice] = "O";
    clickSound.play();
    checkWin("O");
    drawBoard();
}

// Check for winner or draw
function checkWin(player) {
    const wins = [
        [0, 1, 2],[3, 4, 5],[6, 7, 8],
        [0, 3, 6],[1, 4, 7],[2, 5, 8],
        [0, 4, 8],[2, 4, 6]
    ];
    for (const [a, b, c] of wins) {
        if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
            document.getElementById("board").childNodes[a].classList.add("win");
            document.getElementById("board").childNodes[b].classList.add("win");
            document.getElementById("board").childNodes[c].classList.add("win");
            winSound.play();
            alert(`${player} wins!`);
            if (player === "X") simulateWin();
            restartGame();
            return true;
        }
    }
    if (!boardState.includes("")) {
        alert("Draw!");
        restartGame();
        return true;
    }
    drawBoard();
    return false;
}

// Restart the board
function restartGame() {
    boardState = Array(9).fill("");
    currentTurn = "X";
    drawBoard();
}

// --- BACKEND INTEGRATIONS ---
// Simulate win / reward user
async function simulateWin() {
    if (!currentUser) return;
    const res = await fetch(`${API_ROOT}/api/win`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email })
    });
    const data = await res.json();
    currentUser.balance = data.balance;
    currentUser.playsLeft = data.playsLeft;
    updateUserInfo();
}

// Upgrade user to premium
async function upgrade() {
    if (!currentUser) return;
    const res = await fetch(`${API_ROOT}/api/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, amount: 500 })
    });
    const data = await res.json();
    if (data.authorization_url) window.open(data.authorization_url, "_blank");
}

// Withdraw money (simplified — only account + name)
async function withdraw() {
    if (!currentUser) return;
    const account = prompt("Enter your bank account number:");
    if (!account) return alert("Account number is required!");
    const name = prompt("Enter account holder's name:");
    if (!name) return alert("Account holder's name is required!");

    const res = await fetch(`${API_ROOT}/api/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: currentUser.email,
            account_number: account,
            account_name: name
        })
    });
    const data = await res.json();
    if (data.status === "success") {
        alert(`Withdrawal of ₦${currentUser.balance} successful!`);
        currentUser.balance = 0;
        updateUserInfo();
    } else {
        alert(data.message || "Withdrawal failed!");
    }
}
