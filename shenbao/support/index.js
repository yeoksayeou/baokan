#!/usr/bin/env node
// index.js — assumes data/shenbao-index.js and data/overview.js are both loaded first

const contentDiv = document.getElementById('content');

// --- URL Helpers ---
function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function createUrl(base, params = {}) {
  const url = new URL(base, window.location.href);
  url.search = '';
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v);
  });
  return url.toString();
}

// --- SITE INFO & Footer ---
function getIntroductionHTML() {
  return window.SITE_INFO?.introductionText || '';
}

function generateFooter() {
  // you can extend SITE_INFO for footer HTML if desired
  return `<footer class="site-footer">
      <p><a href="../index.html">Project Home</a> | <a href="../about.html">About this Project</a> | <a href="index.html">Newspaper Home</a></p>
      <p>Source of texts: <a href="https://github.com/moss-on-stone/shenbao-txt" target="_blank" rel="noopener noreferrer">shenbao repository</a></p>
      <p>Last updated: April 18, 2025</p>
 </footer>`;
}

function showLoading(msg = 'Loading…') {
  contentDiv.innerHTML = `<div class="loading">${msg}</div>`;
}

function showError(msg) {
  contentDiv.innerHTML = `<div class="error"><p>${msg}</p></div>${generateFooter()}`;
}

// --- Transitions ---
function fadeTransition(updateFn) {
  contentDiv.classList.add('fade-out');
  setTimeout(() => {
    updateFn();
    contentDiv.classList.remove('fade-out');
  }, 150);
}

// --- Keyboard & Swipe Navigation ---
let prevTarget = null, nextTarget = null;

function setupNavigation(prevParams, nextParams) {
  prevTarget = prevParams;
  nextTarget = nextParams;
}

function navigatePrev() {
  if (prevTarget) window.location = createUrl('index.html', prevTarget);
}

function navigateNext() {
  if (nextTarget) window.location = createUrl('index.html', nextTarget);
}

function universalKeyHandler(e) {
  if (e.metaKey || e.ctrlKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePrev(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); navigateNext(); }
}

let touchStartX = 0, touchEndX = 0;
function handleSwipe() {
  const dx = touchEndX - touchStartX;
  if (Math.abs(dx) < 50) return;
  dx > 0 ? navigatePrev() : navigateNext();
}

document.addEventListener('keydown', universalKeyHandler, true);
document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend',   e => { touchEndX   = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

// --- Views ---

function displayYearList() {
  if (!window.ARCHIVE_INDEX) return showError('Archive index not loaded.');
  const introHTML = getIntroductionHTML();
  const years = Object.keys(ARCHIVE_INDEX).sort();

  let html = `<h1>Shenbao - Translations</h1>`;
  html += `<div class="intro">${introHTML}</div>`;
  html += `<div class="year-grid">`;
  years.forEach(y => {
    if (y.includes(' ')) {
        const [year, location] = y.split(' ');
        html += `<a class="year-box" href="${createUrl('index.html',{year:y})}">${year}<span class="location">${location}</span></a>`;
      } else {
        html += `<a class="year-box" href="${createUrl('index.html',{year:y})}">${y}</a>`;
      }
  });
  html += `</div>${generateFooter()}`;

  fadeTransition(() => {
    contentDiv.innerHTML = html;
    setupNavigation(null, null);
    document.title = window.SITE_INFO?.title || 'Shenbao Archive';
  });
}

function displayMonthDayList(year) {
  const data = ARCHIVE_INDEX[year];
  const numericYear = parseInt(year.split(' ')[0], 10);
  if (!data) return showError(`No data for ${year}.`);

  const years = Object.keys(ARCHIVE_INDEX).sort();
  const idx = years.indexOf(year);
  const prevY = idx > 0 ? years[idx - 1] : null;
  const nextY = idx < years.length - 1 ? years[idx + 1] : null;

  let html = `<h2>${year}</h2>`;
  Object.keys(data).sort().forEach(mon => {
    const mi = parseInt(mon, 10) - 1;
    const monthName = new Date(numericYear, mi, 1)
      .toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(numericYear, mi + 1, 0).getDate();
    const availDays = new Set(data[mon].map(o => o.day));
    const firstDow = new Date(numericYear, mi, 1).getDay();

    html += `<div class="month-block">
      <h3>${monthName}</h3>
      <div class="calendar">`;
    // weekday headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      html += `<div class="calendar-header">${d}</div>`;
    });
    // empty slots
    for (let i = 0; i < firstDow; i++) {
      html += `<div class="calendar-empty"></div>`;
    }
    // days
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      if (availDays.has(dd)) {
        const path = data[mon].find(o => o.day === dd).path;
        html += `<a class="day-box" href="${path}">${d}</a>`;
      } else {
        html += `<div class="day-box empty">${d}</div>`;
      }
    }
    html += `</div></div>`;
  });

  html += `<div class="navigation-controls">
    <div class="nav-pagination">
      ${prevY
        ? `<a class="nav-link-prev" href="${createUrl('index.html',{year:prevY})}">‹ ${prevY}</a>`
        : `<span class="nav-link-disabled">‹ Prev</span>`}
      ${nextY
        ? `<a class="nav-link-next" href="${createUrl('index.html',{year:nextY})}">${nextY} ›</a>`
        : `<span class="nav-link-disabled">Next ›</span>`}
    </div>
  </div>`;
  html += generateFooter();

  fadeTransition(() => {
    contentDiv.innerHTML = html;
    setupNavigation(prevY ? { year: prevY } : null, nextY ? { year: nextY } : null);
    document.title = `${year} – ${window.SITE_INFO?.title || 'Shenbao Archive'}`;
  });
}

// --- Initialization ---
function initializeDisplay() {
  showLoading();
  const year = getUrlParam('year');
  requestAnimationFrame(() => {
    year ? displayMonthDayList(year) : displayYearList();
  });
}

window.onload = initializeDisplay;
window.addEventListener('popstate', initializeDisplay);