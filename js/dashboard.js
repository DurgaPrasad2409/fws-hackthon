/* dashboard.js — admin table: search, filter, pagination, delete, CSV export. */
requireAdminLogin();

const PAGE_SIZE = 8;
let page = 1;
const $ = (s) => document.querySelector(s);
const searchInput = $("#searchInput"), categoryFilter = $("#categoryFilter"), statusFilter = $("#statusFilter"), ratingFilter = $("#ratingFilter");
const tableBody = $("#tableBody"), emptyState = $("#emptyState"), pager = $("#pager"), tableWrap = $("#tableWrap");

function getFiltered() {
  const q = searchInput.value.trim().toLowerCase();
  return getAllFeedback().slice().reverse().filter((i) =>
    (!q || i.comment.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)) &&
    (!categoryFilter.value || i.category === categoryFilter.value) &&
    (!statusFilter.value || i.status === statusFilter.value) &&
    (!ratingFilter.value || i.rating === Number(ratingFilter.value)));
}

function renderTable() {
  const rows = getFiltered();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  emptyState.hidden = rows.length > 0;
  tableWrap.hidden = rows.length === 0;
  pager.hidden = rows.length === 0;
  $("#exportBtn").disabled = rows.length === 0;
  $("#resultCount").textContent = rows.length + (rows.length === 1 ? " result" : " results");

  tableBody.innerHTML = slice.map((i) => `
    <tr>
      <td data-label="Date">${formatDate(i.date)}</td>
      <td data-label="Customer"><strong>${esc(i.customerName)}</strong></td>
      <td data-label="Category"><span class="chip">${esc(i.category)}</span></td>
      <td data-label="Rating">${stars(i.rating)}</td>
      <td data-label="Comment" class="cell-comment">${esc(i.comment.length > 70 ? i.comment.slice(0, 70) + "…" : i.comment)}</td>
      <td data-label="Status">${statusBadge(i.status)}</td>
      <td data-label="Actions" class="cell-actions">
        <a class="icon-btn" href="admin-detail.html?id=${encodeURIComponent(i.id)}" title="View / update" aria-label="View feedback">${icon("eye", 17)}</a>
        <button class="icon-btn danger" data-del="${esc(i.id)}" title="Delete" aria-label="Delete feedback">${icon("trash", 17)}</button>
      </td>
    </tr>`).join("");

  const from = (page - 1) * PAGE_SIZE + 1;
  $("#pagerInfo").textContent = `Showing ${from}–${from + slice.length - 1} of ${rows.length}`;
  $("#pageLabel").textContent = `Page ${page} of ${pages}`;
  $("#prevBtn").disabled = page <= 1;
  $("#nextBtn").disabled = page >= pages;
}

[searchInput, categoryFilter, statusFilter, ratingFilter].forEach((el) =>
  el.addEventListener("input", () => { page = 1; renderTable(); }));
$("#prevBtn").addEventListener("click", () => { page--; renderTable(); });
$("#nextBtn").addEventListener("click", () => { page++; renderTable(); });
$("#clearBtn").addEventListener("click", () => {
  [searchInput, categoryFilter, statusFilter, ratingFilter].forEach((el) => (el.value = ""));
  page = 1; renderTable();
});

tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  const ok = await confirmDialog({ title: "Delete this feedback?", message: "This permanently removes the entry. This action can't be undone." });
  if (ok && deleteFeedback(btn.dataset.del)) { toast("Feedback deleted"); renderTable(); }
});

$("#exportBtn").addEventListener("click", () => {
  const rows = getFiltered();
  downloadCSV(`feedback-${new Date().toISOString().slice(0, 10)}.csv`,
    ["ID", "Date", "Customer", "Submitted by", "Category", "Rating", "Comment", "Status", "Admin notes"],
    rows.map((i) => [i.id, i.date, i.customerName, i.submittedBy || "", i.category, i.rating, i.comment, i.status, i.adminNotes || ""]));
  toast(`Exported ${rows.length} ${rows.length === 1 ? "entry" : "entries"} to CSV`);
});

renderTable();
