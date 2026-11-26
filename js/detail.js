/* detail.js — single feedback item: view, update status/notes, delete. */
requireAdminLogin();

const container = document.querySelector("#detailContent");
const id = new URLSearchParams(window.location.search).get("id");
const item = id ? getFeedbackById(id) : null;

if (!item) {
  container.innerHTML = `<div class="card empty-state">${icon("inbox", 28)}<h3>Feedback not found</h3><p>It may have been deleted.</p><a class="btn btn-primary" href="admin-dashboard.html">Back to dashboard</a></div>`;
} else {
  container.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">${esc(item.category)} · ${formatDate(item.date, true)}</div>
      <h1>${esc(item.customerName)}’s feedback</h1></div>${statusBadge(item.status)}</div>
    <div class="detail-grid">
      <section class="card"><h3>Submission</h3>
        <div class="field"><label>Rating</label>${stars(item.rating)}</div>
        <div class="field"><label>Comment</label><p class="comment-full">${esc(item.comment)}</p></div>
        <div class="field"><label>Submitted by</label><p class="hint">${esc(item.submittedBy || "Anonymous")}</p></div>
      </section>
      <section class="card"><h3>Review</h3>
        <div class="field"><label for="statusSelect">Status</label>
          <select id="statusSelect">${["Pending", "Reviewed", "Resolved"].map((s) => `<option ${item.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div class="field"><label for="notesInput">Internal notes</label>
          <textarea id="notesInput" placeholder="Notes only visible to admins…"></textarea></div>
        <div class="btn-row"><button class="btn btn-primary" id="saveBtn">Save changes</button>
          <button class="btn btn-ghost-danger" id="deleteBtn">${icon("trash", 16)}Delete</button></div>
      </section>
    </div>`;
  document.querySelector("#notesInput").value = item.adminNotes || ""; // set as text, never as HTML

  document.querySelector("#saveBtn").addEventListener("click", () => {
    updateFeedback(item.id, { status: document.querySelector("#statusSelect").value, adminNotes: document.querySelector("#notesInput").value });
    toast("Changes saved");
    document.querySelector(".page-head .badge").outerHTML = statusBadge(document.querySelector("#statusSelect").value);
  });
  document.querySelector("#deleteBtn").addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "Delete this feedback?", message: "This permanently removes the entry. This action can't be undone." });
    if (ok) { deleteFeedback(item.id); window.location.href = "admin-dashboard.html"; }
  });
}
