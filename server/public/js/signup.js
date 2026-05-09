async function signup(e) {
  e.preventDefault(); // ✅ prevent reload

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    const res = await fetch("https://online-code-editor-backend-vowg.onrender.com/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    // ✅ FIXED CONDITION (handles "Registered ✅")
    if (data.msg && data.msg.toLowerCase().includes("registered")) {
      alert("Signup successful ✅");

      // ✅ redirect
      window.location.href = "login.html";
    } else {
      alert(data.msg || "Signup failed");
    }

  } catch (err) {
    alert("Server error");
  }
}