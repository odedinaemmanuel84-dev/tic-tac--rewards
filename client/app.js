const API_ROOT = https://tic-tac-rewards-1.onrender.com

// Register new player
async function registerUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  if (res.ok) {
    document.getElementById("register").style.display = "none";
    document.getElementById("game").style.display = "block";
    buildBoard();
  } else {
    alert("Registration failed, check backend!");
  }
}

// Build tic-tac-toe board
function buildBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.addEventListener("click", () => {
      if (!cell.textContent) cell.textContent = "X";
    });
    board.appendChild(cell);
  }
}

// Simulate win
async function simulateWin() {
  const res = await fetch(`${API_ROOT}/win`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: document.getElementById("email").value }),
  });

  const data = await res.json();
  document.getElementById("status").innerText =
    `🎉 You won ₦${data.reward}! Balance: ₦${data.balance}`;
}

// Upgrade with Paystack
function upgrade() {
  alert("💎 Upgrade feature coming soon (Paystack link here).");
}

// Withdraw money
async function withdraw() {
  const account = prompt("Enter your bank account number:");
  const bank = prompt("Enter your bank code:");
  
  const res = await fetch(`${API_ROOT}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      account,
      bank,
    }),
  });

  const data = await res.json();
  alert(data.message || "Withdrawal request sent!");
}
