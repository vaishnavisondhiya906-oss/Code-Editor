document.addEventListener("DOMContentLoaded", () => {

  const navRight = document.getElementById("nav-right");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!navRight) return;

  if (user) {
    navRight.innerHTML = `
      <span class="text-light me-3">👋 ${user.name}</span>
      <button class="btn btn-danger btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    navRight.innerHTML = `
      <a href="login.html" class="btn btn-outline-light btn-sm me-2">Login</a>
      <a href="signup.html" class="btn btn-warning btn-sm">Signup</a>
    `;
  }

});

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}