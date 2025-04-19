#!/usr/bin/env node
// Load data/shenbao-index.js before this script in index.html

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

// --- Footer, Loading & Error ---
function generateFooter() {
  return `
    <footer class="site-footer">
      <p><a href="index.html">All Years</a></p>
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

// --- Keyboard & Swipe Nav ---
let currentPrevTarget = null;
let currentNextTarget = null;

function setupNavigation(prevParams, nextParams) {
  currentPrevTarget = prevParams;
  currentNextTarget = nextParams;
}

function navigatePrev() {
  if (currentPrevTarget) window.location = createUrl('index.html', currentPrevTarget);
}

function navigateNext() {
  if (currentNextTarget) window.location = createUrl('index.html', currentNextTarget);
}

function universalKeyHandler(e) {
  if (e.metaKey||e.ctrlKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault(); navigatePrev();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault(); navigateNext();
  }
}

let touchStartX = 0, touchEndX = 0;
function handleSwipe() {
  const dx = touchEndX - touchStartX;
  if (Math.abs(dx) < 50) return;
  if (dx>0) navigatePrev();
  else navigateNext();
}

document.addEventListener('keydown', universalKeyHandler, true);
document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, {passive:true});

// --- Views ---
function displayYearList() {
  if (!window.ARCHIVE_INDEX) return showError('Index not loaded');
  const years = Object.keys(ARCHIVE_INDEX).sort();
  let html = `<h1>Available Years</h1><ul class="year-list">`;
  years.forEach(year => {
    html += `<li><a href="${createUrl('index.html',{year:year})}">${year}</a></li>`;
  });
  html += `</ul>${generateFooter()}`;
  fadeTransition(() => {
    contentDiv.innerHTML = html;
    document.title = 'Shenbao Archive';
    setupNavigation(null, null);
  });
}

function displayMonthDayList(year) {
  const data = ARCHIVE_INDEX[year];
  if (!data) return showError(`No data for ${year}`);
  const years = Object.keys(ARCHIVE_INDEX).sort();
  const idx = years.indexOf(year);
  const prevYear = idx>0 ? years[idx-1] : null;
  const nextYear = idx<years.length-1 ? years[idx+1] : null;

  let html = `<h2>${year}</h2><div class="month-list">`;
  Object.keys(data).sort().forEach(mon => {
    const mName = new Date(`${year}-${mon}-01`)
      .toLocaleString('default',{month:'long'});
    html += `<div class="month-block">
      <h3>${mName}</h3>
      <div class="day-grid">`;
    data[mon].forEach(({day,path}) => {
      html += `<a class="day-box" href="${path}" title="${year}.${mon}.${day}">${day}</a>`;
    });
    html += `</div></div>`;
  });
  html += `<div class="navigation-controls">
    <div class="nav-pagination">
      ${prevYear
        ? `<a class="nav-link-prev" href="${createUrl('index.html',{year:prevYear})}">‹ ${prevYear}</a>`
        : `<span class="nav-link-disabled">‹ Prev</span>`}
      ${nextYear
        ? `<a class="nav-link-next" href="${createUrl('index.html',{year:nextYear})}">${nextYear} ›</a>`
        : `<span class="nav-link-disabled">Next ›</span>`}
    </div>
  </div>`;
  html += generateFooter();

  fadeTransition(() => {
    contentDiv.innerHTML = html;
    document.title = `${year} – Shenbao`;
    setupNavigation(prevYear?{year:prevYear}:null, nextYear?{year:nextYear}:null);
  });
}

// --- Initialization ---
function initializeDisplay() {
  showLoading();
  const year = getUrlParam('year');
  requestAnimationFrame(() => {
    if (year) displayMonthDayList(year);
    else     displayYearList();
  });
}

window.onload = initializeDisplay;
window.addEventListener('popstate', initializeDisplay);