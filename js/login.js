/* login.js — user sign-in (login.html) and admin-only sign-in (admin-login.html). */
const adminMode = !!document.querySelector("#adminLoginForm");
const redirectFor = (u) => (u.role === "admin" ? "admin-dashboard.html" : "feedback.html");
const existing = getCurrentUser();
if (existing && (!adminMode || existing.role === "admin")) window.location.replace(redirectFor(existing));

(document.querySelector("#loginForm") || document.querySelector("#adminLoginForm")).addEventListener("submit", async (event) => {
  event.preventDefault();
  const btn = document.querySelector("#loginBtn");
  const errorEl = document.querySelector("#loginError");
  errorEl.textContent = "";
  btn.disabled = true;
  const user = await loginUser(document.querySelector("#username").value.trim(), document.querySelector("#password").value);
  btn.disabled = false;
  if (!user) { errorEl.textContent = "Incorrect username or password."; return; }
  if (adminMode && user.role !== "admin") {
    logout();
    errorEl.textContent = "This account doesn't have admin access. Use the regular sign in instead.";
    return;
  }
  window.location.href = redirectFor(user);
});
