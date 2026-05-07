async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const btn = document.getElementById("loginBtn");

  if (!email || !password) {
    alert("Fill all fields");
    return;
  }

  btn.innerText = "Logging in...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    // ✅ FIXED CONDITION
    if (data.msg && data.msg.toLowerCase().includes("success")) {

      // ✅ SAVE USER
      localStorage.setItem("user", JSON.stringify(data.user));

      btn.innerText = "Success ✅";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);

    } else {
      alert(data.msg || "Login failed");
      btn.innerText = "Login";
      btn.disabled = false;
    }

  } catch (err) {
    alert("Server error");
    btn.innerText = "Login";
    btn.disabled = false;
  }
}