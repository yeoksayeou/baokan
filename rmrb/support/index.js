// --- Constants and Globals ---
const contentDiv = document.getElementById('content');
// ARCHIVE_INDEX should be loaded from data/index.js
// SITE_INFO should be loaded from support/overview.js
const monthlyArticleCache = {}; // Cache for decompressed/loaded monthly data
let touchStartX = 0;
let touchEndX = 0;
const MIN_SWIPE_DISTANCE = 50;

// --- Utility Functions ---

/**
 * Gets a parameter from the current URL's query string.
 * @param {string} param - The name of the parameter to get.
 * @returns {string|null} The value of the parameter or null if not found.
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Creates a URL for navigation within the site, preserving existing params if needed.
 * @param {string} base - The base HTML file (usually 'index.html').
 * @param {object} params - An object of query parameters to set.
 * @returns {string} The constructed URL string.
 */
function createUrl(base, params = {}) {
    const url = new URL(base, window.location.href);
    // Clear existing params before setting new ones to avoid conflicts
    url.search = '';
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
}

/**
 * Converts straight quotes to smart quotes in a string.
 * @param {string} text - The input string.
 * @returns {string} The string with smart quotes.
 */
function smartenQuotes(text) {
    if (!text) return '';
    return text
        // Opening double quotes: " at start or after space/punctuation
        .replace(/(^|\s|[-(\["])(")/g, '$1\u201c')
        // Closing double quotes: remaining "
        .replace(/"/g, '\u201d')
        // Opening single quotes: ' at start or after space/punctuation
        .replace(/(^|\s|[-(\['"])\'/g, '$1\u2018')
        // Apostrophes: ' within a word (e.g., don't, it's)
        .replace(/(\w)'(\w)/g, '$1\u2019$2')
        // Closing single quotes: remaining '
        .replace(/'/g, '\u2019');
}


/**
 * Generates the site footer HTML.
 * @returns {string} HTML string for the footer.
 */
function generateFooter() {
    let lastUpdated = "";
    let sourceLink = ""; // Default empty
    let sourceName = ""; // Default empty
    let siteTitle = ""; // Default empty

    if (window.SITE_INFO) {
        lastUpdated = window.SITE_INFO.lastUpdated || "";
        sourceLink = window.SITE_INFO.sourceLink || "";
        sourceName = window.SITE_INFO.sourceName || "";
        siteTitle = window.SITE_INFO.title || "Archive"; // Use full title here
    }

    return `
        <footer class="site-footer">
            <p><a href="../index.html">Project Home</a> | <a href="../about.html">About this Project</a> | <a href="index.html">Newspaper Home</a> | Text Source: <a href="https://github.com/fangj/rmrb">fangj/rmrb</a></p>
            ${sourceLink && sourceName ? `<p>Source of texts: <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">${sourceName}</a></p>` : ''}
            ${lastUpdated ? `<p>Last updated: ${lastUpdated}</p>` : ''}
        </footer>
    `;
}

/**
 * Shows a loading message in the content area.
 * @param {string} message - The message to display.
 */
function showLoading(message = "Loading...") {
    contentDiv.innerHTML = `<div class="loading">${message}</div>`;
    // Ensure focus is managed correctly after loading state
    contentDiv.removeAttribute('tabindex');
}

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
    // Ensure focus is managed correctly after error state
    contentDiv.removeAttribute('tabindex');
}

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
}

// --- Data Loading (Handles local file vs. server) ---

/**
 * Loads the article data for a given month.
 * Uses dynamic script loading for local files (file:///) to avoid CORS.
 * Uses fetch + DecompressionStream for server environments (http/https).
 * Caches the result.
 * @param {string} monthString - The month identifier (e.g., "1966.01").
 * @returns {Promise<Array<object>>} A promise that resolves with the array of article objects.
 */
async function loadMonthData(monthString) {
    // Return cached data if available
    if (monthlyArticleCache[monthString]) {
        console.log(`Using cached data for ${monthString}`);
        return monthlyArticleCache[monthString];
    }

    const isLocal = window.location.protocol === 'file:';
    if (isLocal) {
        // --- Local File Loading (using <script> tag) ---
        const jsPath = `data/${monthString}.js`;
        console.log(`Loading local file via script tag: ${jsPath}`);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsPath;
            script.async = true;

            script.onload = () => {
                console.log(`Script loaded: ${jsPath}`);
                // Assume the script defines a global 'ARTICLES' constant
                if (typeof ARTICLES !== 'undefined') {
                    // IMPORTANT: Deep copy the data to avoid issues if the global
                    // ARTICLES is overwritten by the next script load.
                    const articlesData = JSON.parse(JSON.stringify(ARTICLES));
                    monthlyArticleCache[monthString] = articlesData; // Cache the result
                    console.log(`Successfully loaded and parsed ${articlesData.length} articles for ${monthString} from local script.`);
                    // Clean up the global variable immediately after capturing it
                    // Note: 'const' cannot be deleted, but we can try to nullify if needed,
                    // although overwriting is the main concern handled by copying.
                    // delete window.ARTICLES; // This won't work for 'const'

                    resolve(articlesData);
                } else {
                    console.error(`Global ARTICLES variable not found after loading ${jsPath}`);
                    reject(new Error(`ARTICLES variable not found in ${jsPath}`));
                }
                // Remove the script tag once loaded
                script.remove();
            };

            script.onerror = (event) => {
                console.error(`Failed to load script: ${jsPath}`, event);
                reject(new Error(`Could not load local data file: ${jsPath}. Check if the file exists.`));
                // Remove the script tag on error
                script.remove();
            };

            document.body.appendChild(script);
        });

    } else {
        // --- Server Loading (using fetch + DecompressionStream) ---
        if (typeof DecompressionStream === 'undefined') {
            showError("Your browser does not support the DecompressionStream API required to load compressed data from the server.", false);
            throw new Error("DecompressionStream API not supported.");
        }

        const gzPath = `data/${monthString}.js.gz`;
        console.log(`Workspaceing and decompressing: ${gzPath}`);

        try {
            const response = await fetch(gzPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${gzPath}`);
            }
            if (!response.body) {
                throw new Error("Response body is null or undefined.");
            }

            const ds = new DecompressionStream('gzip');
            const decompressedStream = response.body.pipeThrough(ds);
            let jsContent = await new Response(decompressedStream).text();

            // Remove potential leading/trailing whitespace and the variable assignment
            jsContent = jsContent.trim().replace(/^const\s+ARTICLES\s*=\s*/, '').replace(/;$/, '');

            const articles = JSON.parse(jsContent);
            monthlyArticleCache[monthString] = articles; // Cache the result
            console.log(`Successfully loaded and parsed ${articles.length} articles for ${monthString} from server.`);
            return articles;

        } catch (error) {
            console.error(`Failed to load or process data for ${monthString} from server:`, error);
            let errorMessage = `Could not load data for ${monthString}.`;
             if (error.message.includes("HTTP error")) {
                 errorMessage += " The file might be missing or inaccessible on the server.";
             } else if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                  errorMessage += " A network error occurred.";
             } else if (error instanceof SyntaxError) {
                 errorMessage += " The data file has incorrect JSON format.";
             } else {
                  errorMessage += " An unexpected error occurred during loading or decompression.";
             }
            showError(errorMessage, true);
            throw error; // Re-throw
        }
    }
}


// --- Display Functions ---

/**
 * Displays the list of available years.
 */
function displayYearList() {
    // Check if ARCHIVE_INDEX is defined
    if (typeof ARCHIVE_INDEX === 'undefined' || ARCHIVE_INDEX === null) {
        showError("Archive index is not loaded. Cannot display years.", false);
        return;
    }

    const years = Object.keys(ARCHIVE_INDEX).sort();
    const introHTML = window.SITE_INFO.introductionText
      ? `<div class="introduction-text">${window.SITE_INFO.introductionText}</div>`
      : '';

    if (years.length === 0) {
        showError("No archive data found. Please run the 'create-index.py' script.", false);
        return;
    }

    let html = `<h1>The People’s Daily - Translations</h1>
    ${introHTML}
    <ul class="item-list year-list">`;
    years.forEach(year => {
        html += `<li><a href="${createUrl('index.html', { year: year })}">${year}</a></li>`;
    });
    html += `</ul>${generateFooter()}`;

    fadeTransition(() => {
        contentDiv.innerHTML = html;
        document.title = window.SITE_INFO?.title || "Newspaper Archive";
        setupNavigation(null, null); // Setup basic nav handlers
    });
}

/**
 * Displays the list of available months for a given year.
 * @param {string} year - The year to display months for.
 */
function displayMonthList(year) {
    // Check if ARCHIVE_INDEX is defined and has the year
     if (typeof ARCHIVE_INDEX === 'undefined' || !ARCHIVE_INDEX[year]) {
        showError(`No data found for the year ${year}.`);
        return;
    }
    const months = ARCHIVE_INDEX[year];

    const allYears = Object.keys(ARCHIVE_INDEX).sort();
    const currentYearIndex = allYears.indexOf(year);
    const prevYear = currentYearIndex > 0 ? allYears[currentYearIndex - 1] : null;
    const nextYear = currentYearIndex < allYears.length - 1 ? allYears[currentYearIndex + 1] : null;
    // Format month numbers to month names for display (optional)
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    let html = `<h2>${year}</h2><ul class="item-list month-list">`;
    months.forEach(month => {
        const monthString = `${year}.${month}`;
        const monthName = monthNames[parseInt(month, 10) - 1] || month; // Fallback to number
        html += `<li><a href="${createUrl('index.html', { month: monthString })}">${monthName}</a></li>`;
    });
    html += `</ul>`;

    // Navigation
    html += `
        <div class="navigation-controls">
            <a href="${createUrl('index.html')}" class="nav-link-back">&laquo; All Years</a>
            <div class="nav-pagination">
                ${prevYear ? `<a href="${createUrl('index.html', { year: prevYear })}" class="nav-link-prev">‹ ${prevYear}</a>` : `<span class="nav-link-disabled">‹ Prev Year</span>`}
                ${nextYear ? `<a href="${createUrl('index.html', { year: nextYear })}" class="nav-link-next">${nextYear} ›</a>` : `<span class="nav-link-disabled">Next Year ›</span>`}
            </div>
        </div>
        ${generateFooter()}
    `;
    fadeTransition(() => {
        contentDiv.innerHTML = html;
        document.title = `${year} - Archive`;
        setupNavigation(prevYear ? { year: prevYear } : null, nextYear ? { year: nextYear } : null);
    });
}

/**
 * Displays the list of available days for a given month.
 * @param {string} monthString - The month identifier (e.g., "1966.01").
 */
async function displayDayList(monthString) {
    showLoading(`Loading days for ${monthString}...`);
    try {
        const articles = await loadMonthData(monthString);
        if (!articles || articles.length === 0) {
            // loadMonthData should have shown an error, but double-check
            showError(`No articles found or loaded for ${monthString}.`);
            return;
        }

        // Extract unique days, ensuring date format is correct
        const days = [...new Set(
            articles
                .map(a => a.date ? a.date.split('-')[2] : null) // Get day part
                .filter(day => day !== null && day !== undefined) // Filter out invalid dates
        )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)); // Sort numerically

        if (days.length === 0) {
             showError(`No valid days found in the data for ${monthString}.`);
             return;
        }

        const [year, month] = monthString.split('.');
        // Find previous/next months from ARCHIVE_INDEX
        const allMonthsForYear = ARCHIVE_INDEX[year];
        // Handle case where year might not be in index (shouldn't happen if navigation is correct)
        if (!allMonthsForYear) {
            showError(`Index data missing for year ${year}.`);
            return;
        }
        const currentMonthIndex = allMonthsForYear.indexOf(month);
        let prevMonthString = null;
        let nextMonthString = null;

        // Logic to find previous month (handles year change)
        if (currentMonthIndex > 0) {
            prevMonthString = `${year}.${allMonthsForYear[currentMonthIndex - 1]}`;
        } else {
             const allYears = Object.keys(ARCHIVE_INDEX).sort();
             const currentYearIndex = allYears.indexOf(year);
             if (currentYearIndex > 0) {
                 const prevYear = allYears[currentYearIndex - 1];
                 const monthsInPrevYear = ARCHIVE_INDEX[prevYear];
                 if (monthsInPrevYear && monthsInPrevYear.length > 0) {
                     prevMonthString = `${prevYear}.${monthsInPrevYear[monthsInPrevYear.length - 1]}`;
                 }
             }
        }

        // Logic to find next month (handles year change)
        if (currentMonthIndex < allMonthsForYear.length - 1) {
            nextMonthString = `${year}.${allMonthsForYear[currentMonthIndex + 1]}`;
        } else {
             const allYears = Object.keys(ARCHIVE_INDEX).sort();
             const currentYearIndex = allYears.indexOf(year);
             if (currentYearIndex < allYears.length - 1) {
                 const nextYear = allYears[currentYearIndex + 1];
                 const monthsInNextYear = ARCHIVE_INDEX[nextYear];
                 if (monthsInNextYear && monthsInNextYear.length > 0) {
                     nextMonthString = `${nextYear}.${monthsInNextYear[0]}`;
                 }
             }
        }


        let html = `<h2>${monthString}</h2><ul class="item-list day-list">`;
        days.forEach(day => {
            // Ensure day is padded for consistency if needed, though URL param might not be
            const dayLink = createUrl('index.html', { month: monthString, day: day });
            // Add full view link
            const fullViewLink = createUrl('index.html', { month: monthString, day: day, full: 'yes' });

            html += `
                <li>
                    <a href="${dayLink}">Day ${day}</a>
                    <a href="${fullViewLink}" class="day-list-full-view-link">Full View</a>
                </li>`;
        });
        html += `</ul>`;

        // Navigation
        html += `
            <div class="navigation-controls">
                 <a href="${createUrl('index.html', { year: year })}" class="nav-link-back">&laquo; ${year}</a>
                 <div class="nav-pagination">
                    ${prevMonthString ? `<a href="${createUrl('index.html', { month: prevMonthString })}" class="nav-link-prev">‹ ${prevMonthString}</a>` : `<span class="nav-link-disabled">‹ Prev Month</span>`}
                    ${nextMonthString ? `<a href="${createUrl('index.html', { month: nextMonthString })}" class="nav-link-next">${nextMonthString} ›</a>` : `<span class="nav-link-disabled">Next Month ›</span>`}
                </div>
            </div>
            ${generateFooter()}
        `;
        fadeTransition(() => {
            contentDiv.innerHTML = html;
            document.title = `${monthString} - Archive`;
             setupNavigation(prevMonthString ? { month: prevMonthString } : null, nextMonthString ? { month: nextMonthString } : null);
        });
    } catch (error) {
        // Error likely already shown by loadMonthData
        console.error("Error displaying day list:", error);
        // Optionally show a generic error if not already shown
         if (!contentDiv.querySelector('.error')) {
             showError(`An error occurred while displaying days for ${monthString}.`);
         }
    }
}

/**
 * Displays the list of article titles for a specific day.
 * @param {string} monthString - The month identifier (e.g., "1966.01").
 * @param {string} day - The day (e.g., "01", "15").
 */
async function displayArticleListForDay(monthString, day) {
     showLoading(`Loading articles for ${monthString}-${day}...`);
     try {
        const articles = await loadMonthData(monthString);
        // Ensure date format matches YYYY-MM-DD for filtering
        const dayPadded = day.padStart(2, '0'); // Ensure day is two digits
        const dayDate = `${monthString.replace('.', '-')}-${dayPadded}`;
        // Filter articles for the specific day
        const dayArticlesRaw = articles.filter(a => a.date === dayDate);
        if (dayArticlesRaw.length === 0) {
            showError(`No articles found for ${dayDate}.`);
            return;
        }

        // Sort articles by page number, then path
        const dayArticles = dayArticlesRaw.sort((a, b) => {
            const pageA = parseInt(a.page_number, 10);
            const pageB = parseInt(b.page_number, 10);

            // Handle cases where page_number might be missing or NaN
            const isAPageValid = !isNaN(pageA);
            const isBPageValid = !isNaN(pageB);

            if (isAPageValid && isBPageValid) {
                if (pageA !== pageB) {
                    return pageA - pageB; // Sort by page number first
                }
            } else if (isAPageValid) {
                return -1; // Articles with page numbers come first
            } else if (isBPageValid) {
                return 1; // Articles without page numbers come last
            }
            // If pages are the same or both invalid, sort by path
            return a.path.localeCompare(b.path);
        });
        // Find previous/next days with articles within the month
        const allDaysInMonth = [...new Set(
             articles
                .map(a => a.date ? a.date.split('-')[2] : null)
                .filter(d => d !== null)
        )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        // Find index using the original (potentially unpadded) day parameter
        const currentDayIndex = allDaysInMonth.indexOf(day);
        const prevDay = currentDayIndex > 0 ? allDaysInMonth[currentDayIndex - 1] : null;
        const nextDay = currentDayIndex < allDaysInMonth.length - 1 ? allDaysInMonth[currentDayIndex + 1] : null;

        let html = `<h2>${dayDate}</h2>`;
        // Move Full Day View button to the top
        html += `
            <div class="day-actions-top">
                 <a href="${createUrl('index.html', { month: monthString, day: day, full: 'yes' })}" class="nav-link-fullday">Full Day View</a>
            </div>`;
        html += `<ul class="item-list article-list">`;

        // Add page number headers
        let currentPage = null;
        dayArticles.forEach(article => {
            const articlePage = article.page_number ? parseInt(article.page_number, 10) : null;
            const pageText = !isNaN(articlePage) ? `Page ${articlePage}` : 'Page Unknown';

            // Check if page number changed or if it's the first article
            if (articlePage !== currentPage) {
                // Add a header for the new page number
                html += `<li class="page-header-item"><h3>${pageText}</h3></li>`;
                currentPage = articlePage; // Update current page
            }

            // **MODIFICATION: Use smartenQuotes for the title**
            const smartTitle = smartenQuotes(article.title || 'Untitled');

            // Add the article list item
            html += `
                <li class="article-list-item">
                    <a href="${createUrl('index.html', { articlePath: article.path })}" class="article-title-link">${smartTitle}</a>
                    ${article.author ? `<span class="article-meta-info">by ${article.author}</span>` : ''}
                </li>`;
        });
        html += `</ul>`;
        // Navigation (bottom)
        html += `
            <div class="navigation-controls">
                <a href="${createUrl('index.html', { month: monthString })}" class="nav-link-back">&laquo; ${monthString}</a>
                 <div class="nav-pagination">
                    ${prevDay ? `<a href="${createUrl('index.html', { month: monthString, day: prevDay })}" class="nav-link-prev">‹ Day ${prevDay}</a>` : `<span class="nav-link-disabled">‹ Prev Day</span>`}
                    ${nextDay ? `<a href="${createUrl('index.html', { month: monthString, day: nextDay })}" class="nav-link-next">Day ${nextDay} ›</a>` : `<span class="nav-link-disabled">Next Day ›</span>`}
                </div>
            </div>
            ${generateFooter()}
        `;
        fadeTransition(() => {
            contentDiv.innerHTML = html;
            document.title = `${dayDate} - Archive`;
            setupNavigation(prevDay ? { month: monthString, day: prevDay } : null, nextDay ? { month: monthString, day: nextDay } : null);
        });
     } catch (error) {
        console.error(`Error displaying article list for ${monthString}-${day}:`, error);
        if (!contentDiv.querySelector('.error')) {
             showError(`An error occurred while displaying articles for ${monthString}-${day}.`);
         }
    }
}

/**
 * Formats the article content, splitting English and Chinese parts,
 * and bolding lines starting with '###'.
 * @param {string} content - The raw article content.
 * @returns {string} HTML string with formatted content.
 */
function formatArticleContent(content) {
    if (!content) return '<p><em>No content available.</em></p>';

    const parts = content.split('<hr />');
    const englishPart = parts[0] ? parts[0].trim() : '';
    // Handle potential "Original:" prefix more robustly
    const chinesePartRaw = parts[1] ? parts[1].trim() : '';
    const chinesePart = chinesePartRaw.replace(/^Original:\s*/i, '').trim();

    let html = '';
    // Function to wrap paragraphs and handle '###' bolding
    const formatParas = (text) => {
        // Replace multiple newlines with a single one, then split
        return text.replace(/\n{2,}/g, '\n')
                   .split('\n')
                   .map(p => p.trim())
                   .filter(p => p) // Remove empty lines
                   .map(p => {
                       // Check for '###' prefix
                       if (p.startsWith('###')) {
                           // Remove '###' and any leading space, then wrap in <strong>
                           return `<p><strong>${p.substring(3).trim()}</strong></p>`;
                       } else {
                           // **Apply smartenQuotes to the paragraph content**
                           return `<p>${smartenQuotes(p)}</p>`; // Regular paragraph with smart quotes
                       }
                   })
                   .join('');
    };

    if (englishPart) {
        html += `<div class="english-content" lang="en">${formatParas(englishPart)}</div>`;
    }

    if (englishPart && chinesePart) {
         html += `<hr class="article-separator" />`;
    }

    if (chinesePart) {
        html += `<div class="chinese-content" lang="zh-Hans">${formatParas(chinesePart)}</div>`;
    }

    // Handle cases where only one part exists but the other might be empty string after split
    if (!html && (englishPart || chinesePart)) {
         html = englishPart ? `<div class="english-content">${formatParas(englishPart)}</div>`
                            : `<div class="chinese-content">${formatParas(chinesePart)}</div>`;
    }


    return html || '<p><em>Content could not be formatted.</em></p>'; // Fallback
}


/**
 * Displays a single article.
 * @param {string} articlePath - The path identifier of the article (e.g., "1966.01/1966-01-01_Title.md").
 */
async function displayArticle(articlePath) {
    const monthMatch = articlePath.match(/^(\d{4}\.\d{2})\//);
    const hideEnglish = getUrlParam('lang') === 'cn';
    const toggleParams = { articlePath };
    if (!hideEnglish) toggleParams.lang = 'cn';
    const toggleUrl = createUrl('index.html', toggleParams);

    if (!monthMatch) {
        showError(`Invalid article path format: ${articlePath}`);
        return;
    }
    const monthString = monthMatch[1];

    showLoading(`Loading...`);

    try {
        const articles = await loadMonthData(monthString);
        const article = articles.find(a => a.path === articlePath);

        if (!article) {
            showError(`Article not found: ${articlePath}`);
            return;
        }
        // Ensure date exists before splitting
        const day = article.date ? article.date.split('-')[2] : null;
        if (!day) {
             console.warn(`Article ${articlePath} missing valid date.`);
             showError(`Article ${articlePath} has an invalid date format.`);
             return;
        }


        // Find previous/next articles within the same day (sorted by page, then path)
        const dayArticles = articles
            .filter(a => a.date === article.date)
            .sort((a, b) => {
                const pageA = parseInt(a.page_number, 10);
                const pageB = parseInt(b.page_number, 10);

                // Handle cases where page_number might be missing or NaN
                const isAPageValid = !isNaN(pageA);
                const isBPageValid = !isNaN(pageB);

                if (isAPageValid && isBPageValid) {
                    if (pageA !== pageB) {
                        return pageA - pageB; // Sort by page number first
                    }
                } else if (isAPageValid) {
                    return -1; // Articles with page numbers come first
                } else if (isBPageValid) {
                    return 1; // Articles without page numbers come last
                }
                // If pages are the same or both invalid, sort by path
                return a.path.localeCompare(b.path);
            });

        const currentIndex = dayArticles.findIndex(a => a.path === articlePath);
        const prevArticle = currentIndex > 0 ? dayArticles[currentIndex - 1] : null;
        const nextArticle = currentIndex < dayArticles.length - 1 ? dayArticles[currentIndex + 1] : null;
        // **MODIFICATION: Use smartenQuotes for the title**
        const smartTitle = smartenQuotes(article.title || 'Untitled');
        const smartAuthor = smartenQuotes(article.author || ''); // Also smarten author if present

        let html = `
            <div class="article-header">
                <h2 class="article-title-main">${smartTitle}</h2>
                <div class="article-meta">
                    ${smartAuthor ? `<span><span class="meta-label">Author:</span> ${smartAuthor}</span>` : ''}
                    <span><span class="meta-label">Date:</span> ${article.date}</span>
                    ${article.page_number ? `<span><span class="meta-label">Page:</span> ${article.page_number}</span>` : ''}
                    <a
                      href="${toggleUrl}"
                      class="lang-toggle-btn ${hideEnglish ? 'hidden' : ''}"
                      aria-pressed="${hideEnglish}"
                      aria-label="${hideEnglish ? 'Show English' : 'Hide English'}"
                    >E</a> 
                </div>
            </div>
            <div class="article-content">
                ${(() => {
                   let rawContent = article.content;
                   if (hideEnglish) {
                     const parts = rawContent.split('<hr />');
                     rawContent = parts.length > 1 ? parts.slice(1).join('<hr />') : rawContent;
                   }
                   return formatArticleContent(rawContent);
                 })()}
            </div>
        `;
        // Navigation
        html += `
              <div class="navigation-controls">
                  <a href="${createUrl('index.html', { month: monthString, day })}" class="nav-link-back">« Back</a>
                  <div class="nav-pagination">
                      ${prevArticle
                        ? `<a href="${createUrl('index.html', { articlePath: prevArticle.path, ...(hideEnglish && { lang:'cn' }) })}" class="nav-link-prev">‹ Prev Article</a>`
                        : `<span class="nav-link-disabled">‹ Prev Article</span>`}
                      ${nextArticle
                        ? `<a href="${createUrl('index.html', { articlePath: nextArticle.path, ...(hideEnglish && { lang:'cn' }) })}" class="nav-link-next">Next Article ›</a>`
                        : `<span class="nav-link-disabled">Next Article ›</span>`}
                  </div>
              </div>
            ${generateFooter()}
        `;
        fadeTransition(() => {
            contentDiv.innerHTML = html;
            document.title = `${smartTitle} - ${article.date}`; // Use smart title here too
            window.scrollTo(0, 0); // Scroll to top on article load
            // setupNavigation(prevArticle ? { articlePath: prevArticle.path } : null, nextArticle ? { articlePath: nextArticle.path } : null);
            const prevParams = prevArticle ? { articlePath: prevArticle.path } : null;
            const nextParams = nextArticle ? { articlePath: nextArticle.path } : null;
            if (hideEnglish) {
              if (prevParams) prevParams.lang = 'cn';
              if (nextParams) nextParams.lang = 'cn';
            }
            setupNavigation(prevParams, nextParams);
        });
    } catch (error) {
         console.error(`Error displaying article ${articlePath}:`, error);
         if (!contentDiv.querySelector('.error')) {
             showError(`An error occurred while displaying article ${articlePath}.`);
         }
    }
}

/**
 * Displays all articles for a specific day in full view.
 * @param {string} monthString - The month identifier (e.g., "1966.01").
 * @param {string} day - The day (e.g., "01", "15").
 */
async function displayFullDayView(monthString, day) {
    showLoading(`Loading full view for ${monthString}-${day}...`);
    try {
        const articles = await loadMonthData(monthString);
        const dayPadded = day.padStart(2, '0'); // Ensure day is two digits
        const dayDate = `${monthString.replace('.', '-')}-${dayPadded}`;
        // Filter and sort articles for the day (by page then path, same as list view)
        const dayArticles = articles
            .filter(a => a.date === dayDate)
            .sort((a, b) => {
                const pageA = parseInt(a.page_number, 10);
                const pageB = parseInt(b.page_number, 10);
                const isAPageValid = !isNaN(pageA);
                const isBPageValid = !isNaN(pageB);
                if (isAPageValid && isBPageValid) {
                    if (pageA !== pageB) return pageA - pageB;
                } else if (isAPageValid) return -1;
                  else if (isBPageValid) return 1;
                return a.path.localeCompare(b.path);
            });
        if (dayArticles.length === 0) {
            showError(`No articles found for ${dayDate}.`);
            return;
        }

        // Find previous/next days with articles
        const allDaysInMonth = [...new Set(
             articles
                .map(a => a.date ? a.date.split('-')[2] : null)
                .filter(d => d !== null)
        )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        // Use original day param for finding index
        const currentDayIndex = allDaysInMonth.indexOf(day);
        const prevDay = currentDayIndex > 0 ? allDaysInMonth[currentDayIndex - 1] : null;
        const nextDay = currentDayIndex < allDaysInMonth.length - 1 ? allDaysInMonth[currentDayIndex + 1] : null;
        let html = `<h2>${dayDate} - Full View</h2>`;

        let currentPage = null; // Track page for headers
        dayArticles.forEach((article, index) => {
             const articlePage = article.page_number ? parseInt(article.page_number, 10) : null;
             const pageText = !isNaN(articlePage) ? `Page ${articlePage}` : 'Page Unknown';

             // Add page header if page changes
             if (articlePage !== currentPage) {
                 // Add some spacing before the page header, except for the very first one
                 if (index > 0) {
                     html += `<hr style="margin: 40px 0 30px 0; border-top: 1px solid #ccc; border-bottom: none;">`;
                 }
                 html += `<h3 class="full-day-page-header">${pageText}</h3>`;
                 currentPage = articlePage;
             } else if (index > 0) {
                 // Add a lighter separator between articles on the *same* page
                 html += `<hr style="margin: 30px auto 25px auto; width: 50%; border-top: 1px dashed #ddd; border-bottom: none;">`;
             }

             // **MODIFICATION: Use smartenQuotes for the title and author**
             const smartTitle = smartenQuotes(article.title || 'Untitled');
             const smartAuthor = smartenQuotes(article.author || '');

             html += `
                <div class="article-container-full">
                    <div class="article-header">
                         <h4 class="article-title-main" style="font-size: 1.5em; margin-bottom: 10px;">${smartTitle}</h4>
                         <div class="article-meta" style="font-size: 0.9em; margin-bottom: 15px;">
                            ${smartAuthor ? `<span><span class="meta-label">Author:</span> ${smartAuthor}</span>` : ''}
                            ${article.page_number ? `<span><span class="meta-label">Page:</span> ${article.page_number}</span>` : ''}
                         </div>
                     </div>
                     <div class="article-content">
                         ${formatArticleContent(article.content)}
                     </div>
                </div>`; // Close article-container-full
        });
        // Navigation
        html += `
            <div class="navigation-controls">
                 <a href="${createUrl('index.html', { month: monthString, day: day })}" class="nav-link-back">&laquo; Back to ${dayDate} List</a>
                 <div class="nav-pagination">
                    ${prevDay ? `<a href="${createUrl('index.html', { month: monthString, day: prevDay, full: 'yes' })}" class="nav-link-prev">‹ Day ${prevDay} Full</a>` : `<span class="nav-link-disabled">‹ Prev Day</span>`}
                    ${nextDay ? `<a href="${createUrl('index.html', { month: monthString, day: nextDay, full: 'yes' })}" class="nav-link-next">Day ${nextDay} Full ›</a>` : `<span class="nav-link-disabled">Next Day ›</span>`}
                </div>
            </div>
            ${generateFooter()}
        `;
        fadeTransition(() => {
            contentDiv.innerHTML = html;
            document.title = `${dayDate} Full View - Archive`;
            window.scrollTo(0, 0);
            // Navigation setup for full day view (navigates between full days)
            setupNavigation(
                prevDay ? { month: monthString, day: prevDay, full: 'yes' } : null,
                nextDay ? { month: monthString, day: nextDay, full: 'yes' } : null
            );
        });
    } catch (error) {
        console.error(`Error displaying full day view for ${monthString}-${day}:`, error);
        if (!contentDiv.querySelector('.error')) {
             showError(`An error occurred while displaying the full day view for ${monthString}-${day}.`);
         }
    }
}


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
    // Add visual indicators to links if they exist
    const prevLink = document.querySelector('.nav-link-prev:not(.nav-link-disabled)');
    const nextLink = document.querySelector('.nav-link-next:not(.nav-link-disabled)');
    // Clear existing indicators first
    document.querySelectorAll('.keyboard-shortcut-indicator').forEach(el => el.remove());
    if (prevLink) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = '←';
        prevLink.appendChild(indicator);
    }
     if (nextLink) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = '→';
        nextLink.appendChild(indicator);
    }
}

/**
 * Handles the "previous" navigation action based on the current context.
 */
function navigatePrev() {
    if (currentPrevTarget) {
        console.log("Navigating Prev to:", currentPrevTarget);
        // Use location.assign for clearer history management than setting href directly
        location.assign(createUrl('index.html', currentPrevTarget));
    } else {
        console.log("No previous navigation target.");
    }
}

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
}

/**
 * Global keydown handler for arrow navigation.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function universalKeyHandler(e) {
    // Ignore if modifier keys are pressed or if focus is on an input element
    if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
    }

    if (e.key === 'ArrowLeft') {
        // Check if there's an active previous link before navigating
        if (document.querySelector('.nav-link-prev:not(.nav-link-disabled)')) {
             e.preventDefault();
             navigatePrev();
        }
    } else if (e.key === 'ArrowRight') {
         // Check if there's an active next link before navigating
        if (document.querySelector('.nav-link-next:not(.nav-link-disabled)')) {
            e.preventDefault();
            navigateNext();
        }
    }
}

/**
 * Swipe handler for touch devices.
 */
function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) {
        return; // Ignore minor movements
    }

    if (swipeDistance > 0) { // Swipe Right
        // Check if there's an active previous link before navigating
        if (document.querySelector('.nav-link-prev:not(.nav-link-disabled)')) {
            navigatePrev();
        }
    } else { // Swipe Left
         // Check if there's an active next link before navigating
        if (document.querySelector('.nav-link-next:not(.nav-link-disabled)')) {
            navigateNext();
        }
    }
}

// --- Initialization ---

/**
 * Main function to determine initial display based on URL parameters.
 */
function initializeDisplay() {
    const year = getUrlParam('year');
    const month = getUrlParam('month');
    const day = getUrlParam('day');
    const articlePath = getUrlParam('articlePath');
    const fullDay = getUrlParam('full') === 'yes';
    // Use requestAnimationFrame to ensure DOM is ready for potential focus setting
    // and to prevent potential layout issues during initial load
    requestAnimationFrame(() => {
        try {
            if (articlePath) {
                displayArticle(articlePath);
            } else if (month && day && fullDay) {
                 displayFullDayView(month, day);
            } else if (month && day) {
                displayArticleListForDay(month, day);
            } else if (month) {
                displayDayList(month);
            } else if (year) {
                 displayMonthList(year);
            } else {
                displayYearList();
            }
        } catch (error) {
             console.error("Error during initial display:", error);
             // Show a generic error if one hasn't been shown already
             if (!contentDiv.querySelector('.error')) {
                 showError("An unexpected error occurred while loading the page content.");
             }
        }
    });
}

/**
 * Handles browser back/forward navigation.
 * @param {PopStateEvent} event - The popstate event.
 */
function handlePopState(event) {
    console.log("Popstate event triggered");
    // Re-initialize display based on the URL when navigating history
    // The state object isn't strictly needed if we re-parse the URL
    initializeDisplay();
}

// --- Event Listeners ---
window.addEventListener('popstate', handlePopState);
document.addEventListener('keydown', universalKeyHandler, true); // Use capture phase

// Touch events for swipe - use passive for better performance
document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true }); // Also passive here

// --- Run on Load ---
window.onload = () => {
     // Perform checks early
     // Check for DecompressionStream only needed if NOT local
     if (window.location.protocol !== 'file:' && typeof DecompressionStream === 'undefined') {
         showError("Error: Your browser does not support the DecompressionStream API needed for this site.", false);
         return; // Stop execution if essential API is missing for server mode
     }
     if (typeof ARCHIVE_INDEX === 'undefined') {
         showError("Error: Archive index (data/index.js) not loaded or invalid.", false);
         return; // Stop execution if index is missing
     }

    console.log("Window loaded. Initializing display...");
    initializeDisplay();
};