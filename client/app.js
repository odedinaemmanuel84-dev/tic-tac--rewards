const API_ROOT = "https://tic-tac-rewards-1.onrender.com"; // replace with your backend URL

// DOM elements
const authForm = document.getElementById("authForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const gameContainer = document.getElementById("gameContainer"); // your game div

// Handle login
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
    loadGame(); // show game after login
  } else {
    alert(data.message || "Login failed");
  }
});

// Handle register
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
    loadGame(); // show game after register
  } else {
    alert(data.message || "Registration failed");
  }
});

// Show the game
function loadGame() {
  authForm.style.display = "none"; // hide login/register
  gameContainer.style.display = "block"; // show game
  startGame(); // your game init function
    }
