const API_ROOT = "https://your-backend-url.onrender.com"; // replace with real Render URL
let currentUser = null;

function registerUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  fetch(`${API_ROOT}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  })
    .then(r => r.json())
    .then(data => {
      currentUser = data;
      document.getElementById("register").style.display = "none";
      document.getElementById("game").style.display = "block";
      updateStatus();
      drawBoard();
    });
}

function drawBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    let cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = "";
    board.appendChild(cell);
  }
}

function updateStatus() {
  document.getElementById("status").textContent =
    `Balance: ₦${currentUser.balance} | Plays Left: ${currentUser.playsLeft} | Premium: ${currentUser.premium}`;
}

function simulateWin() {
  fetch(`${API_ROOT}/api/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email })
  })
    .then(r => r.json())
    .then(data => {
      currentUser = data;
      updateStatus();
    });
}

function upgrade() {
  fetch(`${API_ROOT}/api/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email })
  })
    .then(r => r.json())
    .then(data => {
      alert(data.message);
      currentUser.premium = true;
      updateStatus();
    });
}

function withdraw() {
  fetch(`${API_ROOT}/api/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email })
  })
    .then(r => r.json())
    .then(data => {
      alert(data.message);
      currentUser.balance = 0;
      updateStatus();
    });
}
