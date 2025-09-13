const API_URL = "https://tic-tac-rewards-1.onrender.com";
let token = localStorage.getItem("token");
let currentUser = localStorage.getItem("currentUser");
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");

if (token && currentUser) {
  showGame();
}

async function register() {
  let name = document.getElementById("registerName").value;
  let email = document.getElementById("registerEmail").value;
  let password = document.getElementById("registerPassword").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    let res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let data = await res.json();
    if (res.ok) {
      alert("Registered successfully! Now login.");
    } else {
      alert(data.message || "Error registering");
    }
  } catch (err) {
    alert("Server error, try again later.");
  }
}

async function login() {
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;

  try {
    let res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", email);
      currentUser = email;
      showGame();
    } else {
      alert(data.message || "Invalid login");
    }
  } catch (err) {
    alert("Server error, try again later.");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  token = null;
  currentUser = null;
  document.getElementById("auth-container").classList.remove("hidden");
  document.getElementById("game-container").classList.add("hidden");
  bgMusic.pause();
}

function showGame() {
  document.getElementById("auth-container").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");
  document.getElementById("status").innerText = `Welcome ${currentUser}`;
  bgMusic.play();
}

// 🎮 Game Logic
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

function drawBoard() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lime";
  ctx.font = "20px Arial";
  ctx.fillText("Game Running...", 120, 200);
}

function playWithAI() {
  clickSound.play();
  drawBoard();
  document.getElementById("status").innerText = "Playing vs AI 🤖";
}

function playOffline() {
  clickSound.play();
  drawBoard();
  document.getElementById("status").innerText = "Offline Multiplayer 👫";
}

function nextLevel() {
  clickSound.play();
  drawBoard();
  document.getElementById("status").innerText = "Next Level Unlocked 🔓";
}

// 🔹 Withdraw
async function withdrawFunds() {
  let amount = document.getElementById("withdrawAmount").value;
  let accountNumber = document.getElementById("withdrawAccount").value;
  let bankName = document.getElementById("withdrawBank").value;

  if (!amount || !accountNumber || !bankName) {
    alert("Fill all fields");
    return;
  }

  try {
    let res = await fetch(`${API_URL}/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ amount, accountNumber, bankName })
    });

    let data = await res.json();
    if (res.ok) {
      alert("Withdrawal request sent successfully!");
    } else {
      alert(data.message || "Error withdrawing");
    }
  } catch (err) {
    alert("Server error, try again later.");
  }
}
