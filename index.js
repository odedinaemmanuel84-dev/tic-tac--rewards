async function registerUser() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!username || !email || !password) {
    document.getElementById("authMessage").innerText = "Please fill all fields.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    // 👇 DEBUGGING INFO
    document.getElementById("authMessage").innerText = 
      "Server reply: " + JSON.stringify(data);

    if (response.ok) {
      localStorage.setItem("loggedInUser", username);
      showGame(username);
    }
  } catch (err) {
    document.getElementById("authMessage").innerText = "⚠️ Server not reachable.";
  }
}
