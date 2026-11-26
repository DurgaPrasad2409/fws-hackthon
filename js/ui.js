/* ui.js — shared UI helpers: icons, escaping, nav, toasts, confirm dialog, CSV. */
const ICONS = {
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  layout: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z"/>',
  check: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>'
};
function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

/** Escapes user-supplied text before it is placed into innerHTML. */
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function stars(n) {
  n = Number(n) || 0;
  return `<span class="stars" role="img" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? "on" : ""}">${icon("star", 15)}</span>`).join("")}</span>`;
}
function statusBadge(s) {
  const safe = ["Pending", "Reviewed", "Resolved"].includes(s) ? s : "Pending";
  return `<span class="badge badge-${safe.toLowerCase()}">${safe}</span>`;
}
function formatDate(iso, withTime = false) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    (withTime ? ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "");
}

/* ---------- navigation (role-aware) ---------- */
function renderNav() {
  const host = document.querySelector("#nav");
  if (!host) return;
  const active = document.body.dataset.page;
  const u = getCurrentUser();
  const isAdmin = u && u.role === "admin";
  const links = isAdmin
    ? [["admin-dashboard.html", "dash", "layout", "Dashboard"], ["analytics.html", "analytics", "chart", "Analytics"]]
    : [["feedback.html", "give", "message", "Give Feedback"], ["my-feedback.html", "mine", "list", "My Feedback"]];
  host.innerHTML = `<header class="topbar"><div class="topbar-in">
    <a class="brand" href="index.html"><span class="brand-mark">${icon("message", 16)}</span>Feedback<b>Hub</b></a>
    <nav class="nav-links" aria-label="Main">
      ${links.map((l) => `<a href="${l[0]}" class="${l[1] === active ? "active" : ""}">${icon(l[2], 16)}<span>${l[3]}</span></a>`).join("")}
      ${u ? `<span class="user-chip" title="${esc(u.name)} (${esc(u.role)})">${esc(u.name.charAt(0).toUpperCase())}</span>
      <button class="nav-btn" id="logoutLink" type="button">${icon("logout", 16)}<span>Log out</span></button>` : ""}
    </nav></div></header>`;
  const out = document.querySelector("#logoutLink");
  if (out) out.addEventListener("click", () => { logout(); window.location.href = "login.html"; });
}

/* ---------- toast + confirm dialog ---------- */
function toast(message, type = "success") {
  let wrap = document.querySelector(".toasts");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("role", "status"); document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.innerHTML = icon(type === "error" ? "x" : "check", 18) + `<span>${esc(message)}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 250); }, 2800);
}

function confirmDialog({ title, message, confirmText = "Delete" }) {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "modal-overlay";
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
      <div class="modal-icon">${icon("trash", 20)}</div><h3 id="mTitle">${esc(title)}</h3><p>${esc(message)}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-r="0">Cancel</button><button class="btn btn-danger" data-r="1">${esc(confirmText)}</button></div></div>`;
    const done = (v) => { document.removeEventListener("keydown", onKey); el.remove(); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") done(false); };
    el.addEventListener("click", (e) => { if (e.target === el) done(false); const b = e.target.closest("[data-r]"); if (b) done(b.dataset.r === "1"); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(el);
    el.querySelector("[data-r='0']").focus();
  });
}

/* ---------- CSV export (guards against spreadsheet formula injection) ---------- */
function downloadCSV(filename, headers, rows) {
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csv = [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ---------- homepage (index.html): menu, scrollspy, reveal, live stats, session-aware CTAs ---------- */
function initHome() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;
  const btn = nav.querySelector(".nav-toggle");
  const setOpen = (o) => { nav.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o)); };
  btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll(".site-menu a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  const links = [...nav.querySelectorAll('.site-links a[href^="#"]')];
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const sec = document.querySelector(l.getAttribute("href")); if (sec) spy.observe(sec); });

  const rv = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => rv.observe(el));

  const fb = getAllFeedback();
  const vals = {
    total: fb.length,
    avg: fb.length ? (fb.reduce((s, i) => s + i.rating, 0) / fb.length).toFixed(1) : "—",
    users: getAllUsers().filter((u) => u.role !== "admin").length,
    resolved: fb.filter((i) => i.status === "Resolved").length
  };
  document.querySelectorAll("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  const u = getCurrentUser();
  if (u) {
    const home = u.role === "admin" ? "admin-dashboard.html" : "feedback.html";
    nav.querySelectorAll("[data-guest]").forEach((el) => (el.hidden = true));
    const d = nav.querySelector("[data-member]"); d.hidden = false; d.href = home;
    document.querySelectorAll("[data-cta]").forEach((a) => (a.href = home));
  }
}

renderNav();
initHome();
