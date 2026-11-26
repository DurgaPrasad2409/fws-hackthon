# FeedbackHub — Feedback Management System

A frontend-only Feedback Management System built with plain HTML, CSS,
and JavaScript — no frameworks, no backend, no build tools. Everything
runs in the browser; data lives in `localStorage`.

## Modules
- **User Module** — sign up, sign in, submit feedback (rating + category +
  comments), view your own submission history and its status.
- **Admin Module** — sign in, triage all feedback (search/filter), update
  status and add internal notes, view analytics/charts.

## How to run it
1. Unzip this folder.
2. Open `login.html` in your browser. No server needed.
3. **First time on a browser:** a default admin account is created
   automatically (see `js/storage.js`, `DEFAULT_ADMIN_USERNAME` /
   `DEFAULT_ADMIN_PASSWORD` — change these two values to whatever you
   want the seeded admin login to be).
4. Click **Sign Up** to create a regular User Module account.

**Seeded admin login:** `admin` / `admin123`

## Demo flow
1. Sign up as a new user, land on the feedback form.
2. Submit 2–3 feedback entries with different categories/ratings.
3. Check **My Feedback** — only your own submissions show, each with
   its status.
4. Log out, sign back in as `admin` / `admin123` — you're routed
   straight to the Admin Dashboard (module-wise redirection, driven by
   `js/login.js`).
5. Filter/search feedback, open one, change its status, save.
6. Check **Analytics** for the charts.

## File structure
```
feedback-system/
├── login.html / js/login.js       shared sign-in, redirects by role
├── signup.html / js/signup.js     User Module account creation
├── index.html / js/form.js        User Module: submit feedback
├── my-feedback.html / js/my-feedback.js   User Module: own submission history
├── admin-dashboard.html / js/dashboard.js  Admin Module: triage table
├── admin-detail.html / js/detail.js        Admin Module: single item + status
├── analytics.html / js/analytics.js        Admin Module: charts
├── css/style.css                   all styling (Flexbox + CSS Grid)
└── js/storage.js                   the only file that touches localStorage
```

## How auth works (assignment requirement: Signup/Login via localStorage)
`js/storage.js` keeps an array of account objects under the
`fms_users` key in `localStorage` — real signup/login, not a hardcoded
check. `sessionStorage` holds who's currently logged in for the
current tab. Two route guards gate every page:
- `requireLogin()` — used on User Module pages; bounces to `login.html`
  if nobody's signed in.
- `requireAdminLogin()` — used on Admin Module pages; bounces anyone
  who isn't role `"admin"` to `login.html`.

`login.js` reads the logged-in account's `role` and redirects to the
right module (`admin-dashboard.html` vs `index.html`) — that's the
JS-driven module-wise redirection.

## Layout technique
`css/style.css` uses Flexbox for the nav bar, toolbar, and form
layout, and CSS Grid for the analytics stat cards (`.stat-grid`).

## Security & features
- User-supplied text is HTML-escaped everywhere (`esc()` in `js/ui.js`).
- Passwords are salted + hashed (PBKDF2-SHA256, Web Crypto). Old plain-text accounts upgrade automatically on next login.
- Session role is re-checked against the user table, so editing `sessionStorage` can't grant admin.
- Admin: pagination (8/page), delete with confirmation, CSV export of the current filter.

## Known limitation (by design, frontend-only)
With no backend, all data and account hashes live in the browser's
`localStorage`, so anyone with devtools access on that device can read or
edit them. Real access control needs a server.
