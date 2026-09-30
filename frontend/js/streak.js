
const STREAK_LAST_VISIT_KEY = 'mechverse-streak-last-visit';
const STREAK_COUNT_KEY = 'mechverse-streak-count';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// Call once per page load on a page that should count toward the streak.
// Returns the current streak count (after today's visit is recorded).
function recordStreakVisit() {
  const today = todayStr();
  const last = localStorage.getItem(STREAK_LAST_VISIT_KEY);
  let count = Number(localStorage.getItem(STREAK_COUNT_KEY)) || 0;

  if (last === today) {
    // already counted today, no change
  } else if (last && daysBetween(last, today) === 1) {
    count += 1; // consecutive day
  } else {
    count = 1; // gap of 2+ days, or first-ever visit -- restart
  }
  localStorage.setItem(STREAK_LAST_VISIT_KEY, today);
  localStorage.setItem(STREAK_COUNT_KEY, String(count));
  return count;
}

function renderStreakBadge(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const count = recordStreakVisit();
  if (count < 2) { el.innerHTML = ''; return; } // don't bother showing "1-day streak"
  el.innerHTML = `<span class="streak-badge"><span class="flame">🔥</span>${count}-day streak</span>`;
}