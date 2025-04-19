#!/usr/bin/env node
// (Shebang added as requested, though typically not used for browser scripts)

// --- Constants and Globals ---
const contentDiv = document.getElementById('content');
// ARCHIVE_INDEX should be loaded from data/shenbao-index.js (or renamed data/index.js)
// SITE_INFO should be loaded from data/overview.js (if still used)
let touchStartX = 0;
let touchEndX = 0;
const MIN_SWIPE_DISTANCE = 50; // Keep for potential future swipe nav

// --- Utility Functions ---

/**
 * Gets a parameter from the current URL's query string.
 * @param {string} param - The name of the parameter to get.
 * @returns {string|null} The value of the parameter or null if not found.
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
} //

/**
 * Creates a URL for navigation within the site (simplified).
 * @param {string} base - The base HTML file (usually 'index.html').
 * @param {object} params - An object of query parameters to set.
 * @returns {string} The constructed URL string.
 */
function createUrl(base, params = {}) {
    const url = new URL(base, window.location.href);
    // Clear existing params before setting new ones
    url.search = '';
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
} //- Kept for consistency, though links are now direct paths

/**
 * Generates the site footer HTML.
 * @returns {string} HTML string for the footer.
 */
function generateFooter() {
    let lastUpdated = "";
    let sourceLink = "";
    let sourceName = "";
    let siteTitle = "Archive"; // Default

    // Assuming SITE_INFO might still be loaded via data/overview.js
    if (window.SITE_INFO) {
        lastUpdated = window.SITE_INFO.lastUpdated || "";
        sourceLink = window.SITE_INFO.sourceLink || "";
        sourceName = window.SITE_INFO.sourceName || "";
        siteTitle = window.SITE_INFO.title || siteTitle;
    }

    // Adjust links as necessary for the new structure if base paths change
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')); // Assumes index.html is in a subfolder

    return `
        <footer class="site-footer">
             <p><a href="${basePath}/../index.html">Project Home</a> | <a href="${basePath}/../about.html">About this Project</a> | <a href="index.html">Newspaper Home</a></p>
             ${sourceLink && sourceName ? `<p>Source of texts: <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">${sourceName}</a></p>` : ''}
             ${lastUpdated ? `<p>Last updated: ${lastUpdated}</p>` : ''}
        </footer>
    `;
} //- Adjusted project home/about links assumption

/**
 * Shows a loading message in the content area.
 * @param {string} message - The message to display.
 */
function showLoading(message = "Loading...") {
    contentDiv.innerHTML = `<div class="loading">${message}</div>`;
    contentDiv.removeAttribute('tabindex');
} //

/**
 * Shows an error message in the content area.
 * @param {string} message - The error message.
 * @param {boolean} showHomeLink - Whether to show a link back to the home page.
 */
function showError(message, showHomeLink = true) {
    let homeLinkHTML = showHomeLink ? `<p><a href="${createUrl('index.html')}">Return to Archive Home</a></p>` : '';
    contentDiv.innerHTML = `
        <div class="error">
            <p>${message}</p>
            ${homeLinkHTML}
        </div>
        ${generateFooter()}
    `;
    contentDiv.removeAttribute('tabindex');
} //

/**
 * Applies a fade-out/fade-in transition to the content area.
 * @param {function} updateFunction - The function to call to update the content after fade-out.
 */
function fadeTransition(updateFunction) {
    contentDiv.classList.add('fade-out');
    setTimeout(() => {
        updateFunction();
        // Set focus for potential keyboard navigation AFTER content is rendered
        contentDiv.setAttribute('tabindex', '-1');
        contentDiv.focus({ preventScroll: true });
        contentDiv.classList.remove('fade-out');
    }, 150); // Match CSS transition duration
} //

// --- Data Loading ---
// loadMonthData function is removed as per requirements.

// --- Display Functions ---

/**
 * Displays the list of available years from ARCHIVE_INDEX.
 */
function displayYearList() {
    if (typeof ARCHIVE_INDEX === 'undefined' || ARCHIVE_INDEX === null || Object.keys(ARCHIVE_INDEX).length === 0) {
        showError("Archive index (shenbao-index.js) is not loaded or is empty. Cannot display years.", false);
        return;
    } //(Logic adapted)

    const years = Object.keys(ARCHIVE_INDEX).sort(); // [cite: 70]

    let html = `<h1>Shenbao - Translations</h1><ul class="item-list year-list">`; // Title updated
    years.forEach(year => {
        // Link to the same page but add the 'year' parameter
        html += `<li><a href="${createUrl('index.html', { year: year })}">${year}</a></li>`;
    }); // [cite: 71]
    html += `</ul>${generateFooter()}`; // [cite: 72]

    fadeTransition(() => {
        contentDiv.innerHTML = html;
        document.title = window.SITE_INFO?.title || "Shen Bao Archive"; // Updated default title
        setupNavigation(null, null); // Reset navigation targets
    });
} //(Function adapted)


/**
 * Displays the list of available issues for a given year.
 * Uses direct relative paths based on index.html being in the same directory as year folders.
 * @param {string} year - The year to display issues for.
 */
function displayIssueList(year) {
    if (typeof ARCHIVE_INDEX === 'undefined' || !ARCHIVE_INDEX[year]) {
        showError(`No data found for the year ${year}.`);
        return;
    } // (Adapted from)

    const issues = ARCHIVE_INDEX[year]; // Array of {issue: "...", path: "..."} objects [cite: 253]
    if (!issues || issues.length === 0) {
         showError(`No issues found for the year ${year}.`);
         return;
    }

    // Sort issues numerically if possible
    issues.sort((a, b) => {
        const numA = parseInt(a.issue, 10);
        const numB = parseInt(b.issue, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.issue.localeCompare(b.issue); // Fallback sort
    });

    const allYears = Object.keys(ARCHIVE_INDEX).sort();
    const currentYearIndex = allYears.indexOf(year);
    const prevYear = currentYearIndex > 0 ? allYears[currentYearIndex - 1] : null; // (Adapted from [cite: 77])
    const nextYear = currentYearIndex < allYears.length - 1 ? allYears[currentYearIndex + 1] : null; // (Adapted from [cite: 78])

    let html = `<h2>Issues for ${year}</h2><div class="issue-list-container">
    <p>Unfortunately the raw text files for most years were missing exact dates, but instead offered sequential issue numbers. The issue number can give you a rough idea of where you 
    are in the year, while the headlines can be matched up with the PDFs of the newspaper <a style="text-decoration: underline" href="https://archive.org/details/shenbao-archive?sort=date&and%5B%5D=year%3A%22${year}%22">found here on</a> the Internet Archive.</p>`;
    const itemsPerLine = 10;
    let currentLineCount = 0;

    issues.forEach((issueData, index) => {
        if (currentLineCount === 0) {
            html += `<div class="issue-line">`;
        }

        // --- ** SIMPLIFIED PATH ** ---
        // Use the path directly from shenbao-index.js as it's already relative
        // to the location of index.html.
        const issuePath = issueData.path; // e.g., "1944/1944 - 1 - 4925051.html" [cite: 253]
        // --- End Simplified Path ---

        html += `<a href="${issuePath}" class="issue-link">${issueData.issue}</a>`;

        currentLineCount++;
        if (currentLineCount >= itemsPerLine || index === issues.length - 1) {
            html += `</div>`;
            currentLineCount = 0;
        }
    });
    html += `</div>`; // Close issue-list-container

    // Navigation (remains the same)
    html += `
        <div class="navigation-controls">
            <a href="${createUrl('index.html')}" class="nav-link-back">&laquo; All Years</a>
            <div class="nav-pagination">
                 ${prevYear ? `<a href="${createUrl('index.html', { year: prevYear })}" class="nav-link-prev">‹ ${prevYear}</a>` : `<span class="nav-link-disabled">‹ Prev Year</span>`}
                 ${nextYear ? `<a href="${createUrl('index.html', { year: nextYear })}" class="nav-link-next">${nextYear} ›</a>` : `<span class="nav-link-disabled">Next Year ›</span>`}
            </div>
        </div>
        ${generateFooter()}
    `; // (Adapted from)

    fadeTransition(() => {
        contentDiv.innerHTML = html;
        document.title = `${year} Shenbao Translations`;
        // Setup year navigation (remains the same)
        setupNavigation(prevYear ? { year: prevYear } : null, nextYear ? { year: nextYear } : null); // (Adapted from [cite: 85])
    });
}


// --- Removed Functions ---
// displayDayList, displayArticleListForDay, formatArticleContent, displayArticle, displayFullDayView
// smartenQuotes(kept in case needed for footer or titles, but not strictly necessary for core request)

// --- Navigation (Keyboard & Swipe) ---

let currentPrevTarget = null;
let currentNextTarget = null;

/**
 * Sets up the target parameters for the current prev/next navigation actions.
 * @param {object|null} prevTargetParams - Params for the 'prev' action, or null if none.
 * @param {object|null} nextTargetParams - Params for the 'next' action, or null if none.
 */
function setupNavigation(prevTargetParams, nextTargetParams) {
    currentPrevTarget = prevTargetParams;
    currentNextTarget = nextTargetParams;
    console.log("Navigation setup:", "Prev:", currentPrevTarget, "Next:", currentNextTarget);

    // Add visual indicators (arrows) to navigation links
    document.querySelectorAll('.keyboard-shortcut-indicator').forEach(el => el.remove());
    const prevLink = document.querySelector('.nav-link-prev:not(.nav-link-disabled)');
    const nextLink = document.querySelector('.nav-link-next:not(.nav-link-disabled)');

    if (prevLink) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = ' ←'; // Added space for clarity
        prevLink.appendChild(indicator);
    }
     if (nextLink) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = ' →'; // Added space for clarity
        nextLink.appendChild(indicator);
    }
} //(Adapted slightly)

/**
 * Handles the "previous" navigation action based on the current context.
 */
function navigatePrev() {
    if (currentPrevTarget) {
        console.log("Navigating Prev to:", currentPrevTarget);
        location.assign(createUrl('index.html', currentPrevTarget));
    } else {
        console.log("No previous navigation target.");
    }
} //

/**
 * Handles the "next" navigation action based on the current context.
 */
function navigateNext() {
    if (currentNextTarget) {
        console.log("Navigating Next to:", currentNextTarget);
        location.assign(createUrl('index.html', currentNextTarget));
    } else {
         console.log("No next navigation target.");
    }
} //

/**
 * Global keydown handler for arrow navigation.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function universalKeyHandler(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
    }

    if (e.key === 'ArrowLeft') {
        if (document.querySelector('.nav-link-prev:not(.nav-link-disabled)')) {
             e.preventDefault();
            navigatePrev();
        }
    } else if (e.key === 'ArrowRight') {
        if (document.querySelector('.nav-link-next:not(.nav-link-disabled)')) {
            e.preventDefault();
            navigateNext();
        }
    }
} //

/**
 * Swipe handler for touch devices.
 */
function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) {
        return; // Ignore minor movements
    }

    if (swipeDistance > 0) { // Swipe Right (== Previous Year/Issue List)
        if (document.querySelector('.nav-link-prev:not(.nav-link-disabled)')) {
            navigatePrev();
        }
    } else { // Swipe Left (== Next Year/Issue List)
        if (document.querySelector('.nav-link-next:not(.nav-link-disabled)')) {
            navigateNext();
        }
    }
} //

// --- Initialization ---

/**
 * Main function to determine initial display based on URL parameters.
 */
function initializeDisplay() {
    const year = getUrlParam('year');
    // Removed month, day, articlePath, fullDay params

    requestAnimationFrame(() => {
        try {
            if (year) {
                 displayIssueList(year); // Show issues for the selected year
            } else {
                displayYearList(); // Default view: show all years
            }
        } catch (error) {
             console.error("Error during initial display:", error);
             if (!contentDiv.querySelector('.error')) {
                 showError("An unexpected error occurred while loading the page content.");
             }
        }
    });
} //(Adapted for new logic)

/**
 * Handles browser back/forward navigation.
 * @param {PopStateEvent} event - The popstate event.
 */
function handlePopState(event) {
    console.log("Popstate event triggered");
    // Re-initialize display based on the potentially changed URL
    initializeDisplay();
} //

// --- Event Listeners ---
window.addEventListener('popstate', handlePopState); // [cite: 247]
document.addEventListener('keydown', universalKeyHandler, true); // [cite: 247]

// Touch events for swipe
document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true }); // [cite: 247]
document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true }); //

// --- Run on Load ---
window.onload = () => {
     // No need to check for DecompressionStream anymore
     if (typeof ARCHIVE_INDEX === 'undefined') {
         // Update error message to reflect the expected file name
         showError("Error: Archive index (data/shenbao-index.js or data/index.js) not loaded or invalid.", false);
         return; // Stop execution if index is missing
     } //(Adapted)

    console.log("Window loaded. Initializing display...");
    initializeDisplay(); // [cite: 252]
};