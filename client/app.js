const API_URL = "https://tic-tac-rewards-1.onrender.com";
let board = Array(9).fill("");
let currentPlayer = "X";
let premium = false;

function renderBoard() {
  const game = document.getElementById("game");
  game.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = cell;
    div.onclick = () => makeMove(i);
    game.appendChild(div);
  });
}

function makeMove(i) {
  if (board[i]) return;
  board[i] = currentPlayer;
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  renderBoard();
  checkWinner();
}

function checkWinner() {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let combo of winCombos) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      let user = JSON.parse(localStorage.getItem("user"));
      let reward = 100;

      if (user && user.premium) {
        if (user.premiumLevel === "Bronze") reward = 400;
        else if (user.premiumLevel === "Silver") reward = 1000;
        else if (user.premiumLevel === "Gold") reward = 3000;
      }

      document.getElementById("status").textContent = `${board[a]} wins! 🎉 Reward: ₦${reward}`;
      return board[a];
    }
  }
  return null;
}

// Auth
function register() {
  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("regName").value,
      email: document.getElementById("regEmail").value,
      password: document.getElementById("regPass").value
    })
  }).then(res => res.json()).then(data => alert(data.message));
}

function login() {
  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("logEmail").value,
      password: document.getElementById("logPass").value
    })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showProfile();
    } else {
      alert(data.message);
    }
  });
}

function showProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  document.getElementById("auth").style.display = "none";
  document.getElementById("profile").style.display = "block";
  document.getElementById("welcome").textContent = `Welcome, ${user.name}`;
  document.getElementById("premiumStatus").textContent = `Premium: ${user.premiumLevel}`;
  document.getElementById("balance").textContent = `Balance: ₦${user.balance}`;
}

function logout() {
  localStorage.clear();
  location.reload();
}

// Premium
function activatePremium() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first.");
    return;
  }

  let amount = prompt("Enter amount (min ₦500, max ₦5000):", "500");
  if (!amount || isNaN(amount) || amount < 500 || amount > 5000) {
    alert("Invalid amount.");
    return;
  }

  let handler = PaystackPop.setup({
    key: "pk_test_xxxxxxxxxxxxx", // Replace with your Paystack PUBLIC KEY
    email: user.email,
    amount: amount * 100,
    currency: "NGN",
    callback: function(response) {
      fetch(`${API_URL}/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ reference: response.reference, amount })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          alert(`✅ Premium unlocked: ${data.user.premiumLevel}`);
          localStorage.setItem("user", JSON.stringify(data.user));
          showProfile();
        } else {
          alert("❌ Payment verification failed.");
        }
      });
    }
  });

  handler.openIframe();
}

function withdraw() {
  let amount = prompt("Enter withdrawal amount:");
  fetch(`${API_URL}/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ amount })
  }).then(res => res.json()).then(data => alert(data.message));
}

renderBoard();
