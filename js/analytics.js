/* ===================================================================
   analytics.js — stat cards + 3 Chart.js charts built from
   whatever is currently in localStorage.
   =================================================================== */

requireAdminLogin();


const all = getAllFeedback();
if (window.Chart) { Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.color = "#64748B"; }

/* ---------- stat cards ---------- */
function renderStats() {
  const grid = document.querySelector("#statGrid");

  const total = all.length;
  const avgRating = total ? (all.reduce((sum, i) => sum + i.rating, 0) / total).toFixed(1) : "—";
  const pendingCount = all.filter((i) => i.status === "Pending").length;
  const resolvedCount = all.filter((i) => i.status === "Resolved").length;

  const stats = [
    { label: "Total feedback", value: total, icon: "message" },
    { label: "Average rating", value: avgRating, icon: "star" },
    { label: "Pending review", value: pendingCount, icon: "clock" },
    { label: "Resolved", value: resolvedCount, icon: "check" }
  ];

  grid.innerHTML = stats.map((s) => `
    <div class="stat-card"><div class="stat-ico">${icon(s.icon, 18)}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join("");
}

/**
 * Small helper: counts how many items share each value of a given
 * field, e.g. countBy("category") -> { Product: 4, Service: 2, ... }
 */
function countBy(field) {
  const counts = {};
  all.forEach((item) => {
    const key = item[field];
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/* ---------- chart colors, matching our CSS design tokens ---------- */
const COLORS = {
  ink: "#0B1F3A",
  gold: "#F59E0B", blue: "#2563EB",
  teal: "#059669",
  coral: "#DC2626",
  line: "#D7DDE3"
};

function renderCharts() {
  // --- feedback volume by category (bar) ---
  const categoryCounts = countBy("category");
  new Chart(document.querySelector("#categoryChart"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryCounts),
      datasets: [{
        data: Object.values(categoryCounts),
        backgroundColor: COLORS.blue,
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });

  // --- rating distribution (bar, 1-5) ---
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  all.forEach((item) => { ratingCounts[item.rating]++; });
  new Chart(document.querySelector("#ratingChart"), {
    type: "bar",
    data: {
      labels: ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"],
      datasets: [{
        data: Object.values(ratingCounts),
        backgroundColor: [COLORS.coral, COLORS.coral, COLORS.gold, COLORS.teal, COLORS.teal],
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });

  // --- status breakdown (doughnut) ---
  const statusCounts = { Pending: 0, Reviewed: 0, Resolved: 0 };
  all.forEach((i) => { if (i.status in statusCounts) statusCounts[i.status]++; });
  new Chart(document.querySelector("#statusChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [COLORS.gold, COLORS.blue, COLORS.teal]
      }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
  });
}

renderStats();
if (all.length > 0) renderCharts();
if (!all.length) { document.querySelector('.chart-grid').hidden = true; document.querySelector('#noData').hidden = false; }
