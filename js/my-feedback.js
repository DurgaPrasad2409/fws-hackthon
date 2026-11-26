/* my-feedback.js — the logged-in user's own submissions. */
requireLogin();
const currentUser = getCurrentUser() || { username: "" };

if (new URLSearchParams(window.location.search).get("justSubmitted")) {
  document.querySelector("#confirmBox").hidden = false;
}

function renderList() {
  const listEl = document.querySelector("#list");
  const items = getMyFeedback(currentUser.username);
  if (!items.length) {
    listEl.innerHTML = `<div class="card empty-state">${icon("inbox", 28)}<h3>No feedback yet</h3><p>Your submissions will appear here.</p><a class="btn btn-primary" href="feedback.html">Give feedback</a></div>`;
    return;
  }
  listEl.innerHTML = items.map((i) => `
    <article class="card fb-item">
      <div class="fb-head"><span class="chip">${esc(i.category)}</span>${stars(i.rating)}<span class="fb-date">${formatDate(i.date)}</span>${statusBadge(i.status)}</div>
      <p>${esc(i.comment)}</p>
    </article>`).join("");
}
renderList();
