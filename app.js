const STORAGE_KEY = 'violingo-state';

const EXAM_DATE = new Date(2026, 6, 10); // 10 July 2026
EXAM_DATE.setHours(0, 0, 0, 0);

const WEEK_START = new Date(2026, 6, 5); // Sun 5 July 2026

// Fixed prize per day of week (0 = Sun ... 5 = Fri). No Saturday.
const REWARDS = {
  0: { icon: '🎁🎁', label: '2 surprise bags' },
  1: { icon: '🎁🎁🎁', label: '3 surprise bags' },
  2: { icon: '🧸', label: 'A toy' },
  3: { icon: '🎁🎁🎁🎁', label: '4 surprise bags' },
  4: { icon: '🧸', label: 'A toy' },
  5: { icon: '🧵', label: 'Filament' },
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
  const listEl = el('days-list');
  listEl.innerHTML = '';

  for (let i = 0; i < WEEK_LENGTH; i++) {
    const date = new Date(WEEK_START);
    date.setDate(date.getDate() + i);
    const key = toKey(date);
    const weekday = date.getDay();
    const reward = REWARDS[weekday];
    const isToday = date.getTime() === today.getTime();
    const isDone = !!completed[key];

    const dateLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const card = document.createElement('div');
    card.className = 'day-card';
    if (isToday) card.classList.add('today');
    if (isDone) card.classList.add('done');

    card.innerHTML = `
      <div class="day-icon">${isDone ? reward.icon : '❔'}</div>
      <div class="day-info">
        <div class="day-date">${dateLabel}${isToday ? ' · today' : ''}</div>
        <div class="day-task">${isDone ? reward.label : 'Practice today to reveal your prize'}</div>
      </div>
      <div class="day-check">${isDone ? '✓' : ''}</div>
    `;
    card.addEventListener('click', () => toggleDay(key, reward));

    listEl.appendChild(card);
  }
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

  if (!wasDone) {
    showToast(`You revealed: ${reward.label}!`);
  }
}

buildOwl(el('owl-main'));
renderCountdown();
renderDays();
