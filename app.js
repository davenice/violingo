const STORAGE_KEY = 'violingo-state';

const EXAM_DATE = new Date(2026, 6, 10); // 10 July 2026
EXAM_DATE.setHours(0, 0, 0, 0);

const WEEK_START = new Date(2026, 6, 5); // Sun 5 July 2026

// Fixed prize per day of week (0 = Sun ... 5 = Fri). No Saturday.
const REWARDS = {
  0: { label: '2 surprise bags', icon: '🎁' },
  1: { label: '3 surprise bags', icon: '🎁' },
  2: { label: 'A toy', icon: '🧸' },
  3: { label: '4 surprise bags', icon: '🎁' },
  4: { label: 'A toy', icon: '🧸' },
  5: { label: 'Filament', icon: '🧵' },
};

// Themed icon shown on each day's stepping stone (0 = Sun ... 5 = Fri). Friday uses a CSS chest instead.
const DAY_ICONS = {
  0: '⭐',
  1: '📖',
  2: '⭐',
  3: '🎧',
  4: '🏋️',
};

const WEEK_LENGTH = 6; // Sun through Fri

const el = (id) => document.getElementById(id);

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadCompleted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw).completed || {};
  } catch {
    return {};
  }
}

function saveCompleted(completed) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed }));
}

let completed = loadCompleted();

function buildOwl(container) {
  container.innerHTML = `
    <div class="owl-eye left"></div>
    <div class="owl-eye right"></div>
    <div class="owl-beak"></div>
  `;
}

function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function renderCountdown() {
  const today = todayDate();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((EXAM_DATE - today) / msPerDay);

  const countdownEl = el('countdown');
  if (daysLeft > 1) {
    countdownEl.textContent = `${daysLeft} days until your exam!`;
  } else if (daysLeft === 1) {
    countdownEl.textContent = `Exam is tomorrow — you've got this!`;
  } else if (daysLeft === 0) {
    countdownEl.textContent = `Exam day is today. Good luck!`;
  } else {
    countdownEl.textContent = `Exam day has passed. Great work getting here!`;
  }
}

function renderDays() {
  const today = todayDate();
  const pathEl = el('days-path');
  pathEl.innerHTML = '';

  for (let i = 0; i < WEEK_LENGTH; i++) {
    const date = new Date(WEEK_START);
    date.setDate(date.getDate() + i);
    const key = toKey(date);
    const weekday = date.getDay();
    const reward = REWARDS[weekday];
    const isToday = date.getTime() === today.getTime();
    const isDone = !!completed[key];
    const isFriday = weekday === 5;

    const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
    const dateNum = date.getDate();

    const row = document.createElement('div');
    row.className = 'stone-row';

    const stone = document.createElement('div');
    stone.className = 'stone';
    if (isToday) stone.classList.add('today');
    if (isDone) stone.classList.add('done');

    const iconHtml = isFriday ? '<div class="chest-icon"></div>' : DAY_ICONS[weekday];

    stone.innerHTML = `
      <div class="stone-icon">${iconHtml}</div>
      <div class="stone-day">${dayLabel} ${dateNum}</div>
      ${isDone ? '<div class="stone-check">✓</div>' : ''}
    `;
    stone.addEventListener('click', () => toggleDay(key, reward));

    row.appendChild(stone);
    pathEl.appendChild(row);
  }
}

function getLastPrize() {
  let latestKey = null;
  for (let i = 0; i < WEEK_LENGTH; i++) {
    const date = new Date(WEEK_START);
    date.setDate(date.getDate() + i);
    const key = toKey(date);
    if (completed[key]) latestKey = key;
  }
  if (!latestKey) return null;
  const [y, m, d] = latestKey.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return REWARDS[weekday];
}

function renderLastPrize() {
  const prize = getLastPrize();
  el('last-prize-icon').textContent = prize ? prize.icon : '🎁';
  el('last-prize-value').textContent = prize ? prize.label : 'Practice to win your first prize!';
}

function toggleDay(key, reward) {
  const wasDone = !!completed[key];
  if (wasDone) {
    delete completed[key];
  } else {
    completed[key] = true;
  }
  saveCompleted(completed);
  renderDays();
  renderLastPrize();

  if (!wasDone) {
    showToast(`You revealed: ${reward.label}!`);
  }
}

buildOwl(el('owl-main'));
renderCountdown();
renderDays();
renderLastPrize();
