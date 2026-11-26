/* storage.js — the only file that touches localStorage / sessionStorage. */
const FEEDBACK_KEY = "fms_feedback";
const USERS_KEY = "fms_users";
const SESSION_KEY = "fms_session";

/* ===================== FEEDBACK ===================== */
function getAllFeedback() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || []; } catch { return []; }
}
function saveAllFeedback(list) { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list)); }

function addFeedback({ customerName, category, rating, comment, submittedBy }) {
  const list = getAllFeedback();
  const entry = {
    id: "fb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    customerName: customerName || "Anonymous",
    submittedBy: submittedBy || null,
    category, rating: Number(rating), comment,
    status: "Pending", adminNotes: "", date: new Date().toISOString()
  };
  list.push(entry);
  saveAllFeedback(list);
  return entry;
}
function getFeedbackById(id) { return getAllFeedback().find((i) => i.id === id); }
function getMyFeedback(username) {
  return getAllFeedback().filter((i) => i.submittedBy && i.submittedBy.toLowerCase() === username.toLowerCase()).reverse();
}
function updateFeedback(id, changes) {
  const list = getAllFeedback();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...changes };
  saveAllFeedback(list);
  return list[idx];
}
function deleteFeedback(id) {
  const list = getAllFeedback();
  const next = list.filter((i) => i.id !== id);
  saveAllFeedback(next);
  return next.length !== list.length;
}

/* ===================== PASSWORD HASHING =====================
   PBKDF2-SHA256 (100k iterations) with a random per-user salt via the
   Web Crypto API. Falls back to a weak checksum only if Web Crypto is
   unavailable (non-secure context). Legacy plain-text accounts are
   upgraded automatically on their next successful login. */
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
function newSalt() { return toHex(crypto.getRandomValues(new Uint8Array(16))); }

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  if (window.crypto && crypto.subtle) {
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, key, 256);
    return toHex(bits);
  }
  let h = 5381;
  for (const c of enc.encode(salt + ":" + password)) h = ((h << 5) + h + c) >>> 0;
  return "f" + h.toString(16);
}

/* ===================== USER ACCOUNTS ===================== */
function getAllUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function saveAllUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

// Default admin — created on first run if no admin exists. Change these values as needed.
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function seedDefaultAdmin() {
  const users = getAllUsers();
  if (users.some((u) => u.role === "admin")) return;
  const salt = newSalt();
  users.push({ name: "Admin", username: DEFAULT_ADMIN_USERNAME, salt, hash: await hashPassword(DEFAULT_ADMIN_PASSWORD, salt), role: "admin" });
  saveAllUsers(users);
}
const storageReady = seedDefaultAdmin();

/** Creates a "user" account. Resolves to the user, or null if the username is taken. */
async function registerUser({ name, username, password }) {
  await storageReady;
  const users = getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return null;
  const salt = newSalt();
  const user = { name, username, salt, hash: await hashPassword(password, salt), role: "user" };
  users.push(user);
  saveAllUsers(users);
  return user;
}

/** Verifies credentials and starts a session. Resolves to the user, or null. */
async function loginUser(username, password) {
  await storageReady;
  const users = getAllUsers();
  const u = users.find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!u) return null;

  if (u.hash) {
    if ((await hashPassword(password, u.salt)) !== u.hash) return null;
  } else if (u.password !== undefined && u.password === password) {
    // legacy plain-text account: verify, then upgrade to a salted hash
    u.salt = newSalt();
    u.hash = await hashPassword(password, u.salt);
    delete u.password;
    saveAllUsers(users);
  } else {
    return null;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: u.username }));
  return u;
}

function logout() { sessionStorage.removeItem(SESSION_KEY); }

/** Current {name, username, role}. Role is always re-read from the user table, so a tampered session can't grant admin. */
function getCurrentUser() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    const u = s && getAllUsers().find((x) => x.username === s.username);
    return u ? { name: u.name, username: u.username, role: u.role } : null;
  } catch { return null; }
}
function requireLogin() { if (!getCurrentUser()) window.location.replace("login.html"); }
function requireAdminLogin() {
  const u = getCurrentUser();
  if (!u || u.role !== "admin") window.location.replace("login.html");
}
