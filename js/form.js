/* ===================================================================
   form.js — feedback form interactions and client-side validation
   =================================================================== */

requireLogin();

const currentUser = getCurrentUser() || { name: "", username: "" };
const form = document.querySelector("#feedbackForm");
const starButtons = Array.from(document.querySelectorAll("#starInput button"));
const ratingInput = document.querySelector("#rating");
const ratingHint = document.querySelector("#ratingHint");
const commentInput = document.querySelector("#comment");
const commentCount = document.querySelector("#commentCount");
const formMessage = document.querySelector("#formMessage");
const submitButton = document.querySelector("#submitFeedback");

let selectedRating = 0;


document.querySelector("#customerName").value = currentUser.name;

function paintStars(value, className) {
  starButtons.forEach((button) => {
    const active = Number(button.dataset.value) <= value;
    button.classList.toggle(className, active);
  });
}

function chooseRating(value) {
  selectedRating = value;
  ratingInput.value = String(value);
  ratingHint.textContent = `${value} out of 5 selected`;
  ratingHint.classList.remove("error-text");
  starButtons.forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.value) <= value);
    button.setAttribute("aria-pressed", String(Number(button.dataset.value) === value));
  });
}

starButtons.forEach((button, index) => {
  button.addEventListener("click", () => chooseRating(Number(button.dataset.value)));
  button.addEventListener("mouseenter", () => paintStars(Number(button.dataset.value), "hovered"));
  button.addEventListener("focus", () => paintStars(Number(button.dataset.value), "hovered"));
  button.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") nextIndex = Math.min(4, index + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextIndex = Math.max(0, index - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = 4;
    else return;
    event.preventDefault();
    starButtons[nextIndex].focus();
    chooseRating(nextIndex + 1);
  });
});

document.querySelector("#starInput").addEventListener("mouseleave", () => {
  starButtons.forEach((button) => button.classList.remove("hovered"));
});
document.querySelector("#starInput").addEventListener("focusout", () => {
  setTimeout(() => starButtons.forEach((button) => button.classList.remove("hovered")), 0);
});

commentInput.addEventListener("input", () => {
  commentCount.textContent = `${commentInput.value.length} / 500`;
});

function showError(message, target) {
  formMessage.textContent = message;
  formMessage.className = "form-message error-text";
  if (target) target.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "form-message";

  const customerName = document.querySelector("#customerName");
  const category = document.querySelector("#category");
  const comment = commentInput.value.trim();

  if (!customerName.value.trim()) return showError("Please enter your name.", customerName);
  if (!category.value) return showError("Please choose a feedback category.", category);
  if (!selectedRating) {
    ratingHint.textContent = "Please choose a star rating before submitting.";
    ratingHint.classList.add("error-text");
    starButtons[0].focus();
    return;
  }
  if (comment.length < 5) return showError("Please enter at least 5 characters in your comment.", commentInput);

  const entry = addFeedback({
    customerName: customerName.value.trim(),
    submittedBy: currentUser.username,
    category: category.value,
    rating: selectedRating,
    comment
  });

  submitButton.disabled = true;
  submitButton.textContent = "Feedback submitted ✓";
  formMessage.textContent = "Thank you! Your feedback has been saved successfully.";
  formMessage.className = "form-message success-text";

  // Keep the confirmation visible briefly, then open the user's feedback history.
  window.setTimeout(() => {
    window.location.href = "my-feedback.html?justSubmitted=" + encodeURIComponent(entry.id);
  }, 900);
});

function renderPulse() {
  const pulse = document.querySelector("#pulse");
  const emptyMsg = document.querySelector("#pulseEmpty");
  const recent = getAllFeedback().slice(-20);
  if (!recent.length) return;

  emptyMsg.remove();
  recent.forEach((item) => {
    const dot = document.createElement("span");
    dot.className = "pulse-dot " + (item.rating <= 2 ? "low" : item.rating === 3 ? "mid" : "high");
    dot.title = `${item.rating} star${item.rating > 1 ? "s" : ""} — ${item.category}`;
    dot.setAttribute("aria-label", dot.title);
    pulse.appendChild(dot);
  });
}

renderPulse();
