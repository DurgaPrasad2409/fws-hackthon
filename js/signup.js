/* signup.js — creates a User Module account, then signs in. */
document.querySelector("#signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.querySelector("#name").value.trim();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value;
  const errorEl = document.querySelector("#signupError");
  const btn = document.querySelector("#signupBtn");

  if (!name || !username || password.length < 6) {
    errorEl.textContent = "Please fill every field (password needs 6+ characters).";
    return;
  }
  btn.disabled = true;
  const user = await registerUser({ name, username, password });
  if (!user) { btn.disabled = false; errorEl.textContent = "That username is already taken — try another."; return; }
  await loginUser(username, password);
  window.location.href = "feedback.html";
});
