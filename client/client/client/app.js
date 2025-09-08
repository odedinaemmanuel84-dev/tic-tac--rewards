// client/app.js

// 🔹 Your backend API URL
const API_ROOT = https://tic-tac-rewards-2.onrender.com

// Helper to send POST requests
async function postData(url = "", data = {}) {
  try {
    const response = await fetch(API_ROOT + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (err) {
    console.error("❌ API error:", err);
    return { error: "Network error" };
  }
}

// ✅ Register user
async function registerUser(username, email) {
  const result = await postData("/register", { username, email });
  if (result.error) {
    alert("⚠️ " + result.error);
  } else {
    alert("✅ Registered: " + result.user.username);
  }
}

// ✅ Login user
async function loginUser(email) {
  const result = await postData("/login", { email });
  if (result.error) {
    alert("⚠️ " + result.error);
  } else {
    alert("✅ Logged in as " + result.user.username);
  }
}

// 🔹 Hook up buttons (make sure your HTML has #registerBtn and #loginBtn)
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      registerUser(username, email);
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("emailLogin").value;
      loginUser(email);
    });
  }
});
