const API_ROOT = https://tic-tac-rewards-1.onrender.com
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
      currentUser.balance = data.balance;
      currentUser.playsLeft = data.playsLeft;
      updateStatus();
    });
}

function upgrade() {
  fetch(`${API_ROOT}/api/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, amount: 500 })
  })
    .then(r => r.json())
    .then(data => {
      if (data.authorization_url) {
        window.open(data.authorization_url, "_blank");
      }
    });
}

function withdraw() {
  const account = prompt("Enter your bank account number:");
  const bank = prompt("Enter your bank code (e.g. 058 for GTB):");
  fetch(`${API_ROOT}/api/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, account_number: account, bank_code: bank })
  })
    .then(r => r.json())
    .then(data => {
      alert(JSON.stringify(data));
      currentUser.balance = 0;
      updateStatus();
    });
}
