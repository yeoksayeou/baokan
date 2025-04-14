// Function to get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to generate the site footer
function generateFooter() {
    // Use site info if available
    let lastUpdated = "";
    let sourceLink = "https://db.history.go.kr/modern/";
    let sourceName = "국사편찬위원회";
    let siteTitle = "";
    
    if (window.SITE_INFO) {
        lastUpdated = window.SITE_INFO.lastUpdated || "";
        sourceLink = window.SITE_INFO.sourceLink || sourceLink;
        sourceName = window.SITE_INFO.sourceName || sourceName;
        
        // Extract the first word from the title if available
        if (window.SITE_INFO.title) {
            siteTitle = window.SITE_INFO.title.split(' ')[0];
        }
    }
    
    if (window.SITE_INFO) {
        lastUpdated = window.SITE_INFO.lastUpdated || "";
        sourceLink = window.SITE_INFO.sourceLink || sourceLink;
        sourceName = window.SITE_INFO.sourceName || sourceName;
    }
    
    return `
        <footer class="site-footer">
            <p><a href="../index.html">Project Home</a> - <a href="https://github.com/yeoksayeou/yeoksayeou.github.io">Project Repository</a></p>
            <p>${lastUpdated ? `Last updated: ${lastUpdated}` : ''} ${lastUpdated ? ' | ' : ''} Source of texts for ${siteTitle}: <a href="${sourceLink}" target="_blank">${sourceName}</a></p>
        </footer>
    `;
}

document.addEventListener('keydown', function(e) {
    // Skip if user is in a form field
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.tagName === 'SELECT') {
        return;
    }
    
    if (e.key === 'ArrowLeft') {
        // First check for article navigation
        const articleLink = document.querySelector('.nav-article-link.nav-link-prev');
        if (articleLink) {
            e.preventDefault();
            const path = articleLink.getAttribute('data-path');
            if (path) {
                displayArticle(path);
                return;
            }
        }
        
        // Then check for issue navigation
        const issueLink = document.querySelector('.nav-link-prev:not(.nav-article-link):not(.nav-link-disabled)');
        if (issueLink) {
            e.preventDefault();
            issueLink.click();
            return;
        }
    } 
    else if (e.key === 'ArrowRight') {
        // First check for article navigation
        const articleLink = document.querySelector('.nav-article-link.nav-link-next');
        if (articleLink) {
            e.preventDefault();
            const path = articleLink.getAttribute('data-path');
            if (path) {
                displayArticle(path);
                return;
            }
        }
        
        // Then check for issue navigation
        const issueLink = document.querySelector('.nav-link-next:not(.nav-article-link):not(.nav-link-disabled)');
        if (issueLink) {
            e.preventDefault();
            issueLink.click();
            return;
        }
    }
}, true); 

function formatIssueForDisplay(issue) {
    // First replace underscores with spaces
    let displayIssue = issue.replace(/_/g, " ");
    
    // Then replace "sk" with "신간" if it's at the beginning of the string
    displayIssue = displayIssue.replace(/^sk /i, "신간 ");
    
    return displayIssue;
}

function loadIssueScript(issue, callback) {
    const baseDir = isEnglishMode() ? 'data/index_en/' : 'data/index/';
    const fileName = encodeURIComponent(issue) + '.js';
    const script = document.createElement('script');
    script.src = baseDir + fileName;
    script.onload = () => {
        if (typeof window.ISSUE_DATA === 'undefined') {
            console.error('ISSUE_DATA not defined in file:', script.src);
            return;
        }
        callback(window.ISSUE_DATA);
        delete window.ISSUE_DATA; // clean up global namespace
    };
    script.onerror = () => {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div class="error">
                <p>Could not load issue data for "${issue}".</p>
                <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
            </div>
        `;
    };
    document.body.appendChild(script);
}

// Check if English language mode is active
function isEnglishMode() {
    return getUrlParam('lang') === 'en';
}

// Function to create URLs that preserve the language parameter
function createUrl(base, params = {}) {
    const url = new URL(base, window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    
    // Copy existing language parameter if present
    if (isEnglishMode()) {
        url.searchParams.set('lang', 'en');
    }
    
    // Add all other parameters
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    
    return url.toString();
}

function loadIssueScript(issue, callback) {
    const baseDir = isEnglishMode() ? 'data/index_en/' : 'data/index/';
    const fileName = encodeURIComponent(issue) + '.js';
    const script = document.createElement('script');
    script.src = baseDir + fileName;
    script.onload = () => {
        if (typeof window.ISSUE_DATA === 'undefined') {
            console.error('ISSUE_DATA not defined in file:', script.src);
            return;
        }
        const data = window.ISSUE_DATA;
        delete window.ISSUE_DATA;
        callback(data);
    };
    script.onerror = () => {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div class="error">
                <p>Could not load issue data for "${issue}".</p>
                <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
            </div>
        `;
    };
    document.body.appendChild(script);
}

// Toggle language mode
function toggleLanguageMode() {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    
    if (isEnglishMode()) {
        params.delete('lang');
    } else {
        params.set('lang', 'en');
    }
    
    currentUrl.search = params.toString();
    window.location.href = currentUrl.toString();
}

// Initialize language toggle
function initLanguageToggle() {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.checked = isEnglishMode();
        toggle.addEventListener('change', toggleLanguageMode);
    }
    
    // Apply 'english-mode' class to body when in English mode
    if (isEnglishMode()) {
        document.body.classList.add('english-mode');
    }
}

// Get all unique issues sorted
function getAllSortedIssues() {
    if (typeof ISSUE_LIST !== 'undefined') {
        return ISSUE_LIST;
    }
    return [...new Set(ARTICLES.map(item => item.issue))].sort();
}

// Get adjacent issues (previous and next)
function getAdjacentIssues(currentIssue) {
    const allIssues = getAllSortedIssues();
    const currentIndex = allIssues.indexOf(currentIssue);
    
    return {
        prevIssue: currentIndex > 0 ? allIssues[currentIndex - 1] : null,
        nextIssue: currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null
    };
}

// Function to find PDF path for a given issue
function getPdfPath(issueName) {
    if (typeof PDFS === 'undefined') return null;
    
    const normalized = issueName.normalize('NFD');
    const pdfInfo = PDFS.find(pdf => pdf.issue === normalized);
    return pdfInfo && pdfInfo.path ? pdfInfo.path : null;
}

// Function to process markdown-style bold text in English mode
function processBoldText(text) {
    if (!isEnglishMode()) return text;
    
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Format the article content with proper formatting
function formatContent(content, type) {
    // Process bold text markup if in English mode
    const processedContent = processBoldText(content);
    
    // For poetry, preserve line breaks without paragraph spacing
    if (type === '시') {
        return `<div class="poetry">${processedContent}</div>`;
    }
    
    // For all other types, handle paragraphs
    return processedContent.split('\n').map(paragraph => {
        // Skip empty paragraphs
        if (paragraph.trim() === '') return '';
        return `<p>${paragraph}</p>`;
    }).join('');
}

// Display list of unique issues
// Display list of unique issues
function displayIssueList() {
    const contentDiv = document.getElementById('content');
    
    // Extract unique issues
    const uniqueIssues = getAllSortedIssues();
    
    let issueListHTML = ``;
    
    // Use site info if available
    const siteTitle = window.SITE_INFO ? window.SITE_INFO.title : "Korean Periodicals Archive";
    const lastUpdated = window.SITE_INFO ? window.SITE_INFO.lastUpdated : "";
    const sourceLink = window.SITE_INFO ? window.SITE_INFO.sourceLink : "https://db.history.go.kr/modern/";
    const sourceName = window.SITE_INFO ? window.SITE_INFO.sourceName : "국사편찬위원회";
    const version = window.SITE_INFO ? window.SITE_INFO.version : "";
    
    issueListHTML += `
        <div class="article-header">
            <div class="article-title">${siteTitle}</div>
            ${version ? `<div class="version-info">Version ${version}</div>` : ''}
        </div>
        <h2>Available Issues</h2>
        <ul class="issue-list">
    `;
    
    uniqueIssues.forEach(issue => {
        const pdfPath = getPdfPath(issue);
        const displayIssue = formatIssueForDisplay(issue); // Format for display
        
        issueListHTML += `
            <li>
                <div>
                    <a href="${createUrl('index.html', {issue: issue})}">${displayIssue}</a>
                    <a href="${createUrl('index.html', {issue: issue, all: 'yes'})}" class="all-link">Full View</a>
                    ${pdfPath ? `<span class="link-separator">|</span><a href="${pdfPath}" class="all-link" target="_blank">PDF</a>` : ''}
                </div>
            </li>
        `;
    });
    
    issueListHTML += `</ul>`;
    
    // Remove the dummy navigation buttons that were here
    
    issueListHTML += generateFooter();
    
    contentDiv.innerHTML = issueListHTML;
    
    // Ensure the content container is focusable and receives focus for keyboard navigation in Firefox.
    contentDiv.setAttribute('tabindex', '-1');
    contentDiv.focus({preventScroll: true});
}

// Display articles in a specific issue
function displayIssueArticles(issueName, pushState = true) {
    const contentDiv = document.getElementById('content');
    const showAll = getUrlParam('all') === 'yes';

    // Show loading indicator
    contentDiv.innerHTML = `<div class="loading">Loading...</div>`;

    loadIssueScript(issueName, (issueArticles) => {
        const pdfPath = getPdfPath(issueName);
        const { prevIssue, nextIssue } = getAdjacentIssues(issueName);
        const displayIssueName = formatIssueForDisplay(issueName); // Format for display

        issueArticles.sort((a, b) => {
            const getFileNumber = (path) => {
                const matches = path.match(/\/(\d+)\.txt$/);
                return matches ? parseInt(matches[1], 10) : 0;
            };
            return getFileNumber(a.path) - getFileNumber(b.path);
        });

        if (issueArticles.length === 0) {
            contentDiv.innerHTML = `
                <div class="error">
                    <p>No articles found for issue "${displayIssueName}".</p>
                    <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
                </div>
            `;
            return;
        }

        if (showAll) {
            let allArticlesHTML = `
                <div class="article-header">
                    <div class="issue-title">
                        ${displayIssueName}
                        <a href="${createUrl('index.html', {issue: issueName})}" class="all-articles-link">List</a>
                        ${pdfPath ? `<a href="${pdfPath}" class="all-articles-link" target="_blank" style="margin-left: 10px;">PDF</a>` : ''}
                    </div>
                </div>
            `;

            issueArticles.forEach((article, index) => {
                const authorLinksHTML = article.author ? 
                    (isEnglishMode() ?
                        `<a href="${createUrl('index.html', {author: article.author})}" style="color: inherit; text-decoration: none;">${article.author}</a>` :
                        article.author.split(' ').map(name => 
                            `<a href="${createUrl('index.html', {author: name})}" style="color: inherit; text-decoration: none;">${name}</a>`
                        ).join(' ')
                    ) : 'Unknown';

                allArticlesHTML += `
                    <div class="article-container">
                        <div class="article-header">
                            <div class="article-title">${article.title}</div>
                            <div class="article-meta">
                                <div class="article-meta-row">
                                    ${article.author ? `<span class="meta-label">Author:</span> ${article.author} <span class="meta-separator">|</span>` : ''}
                                    <span class="meta-label">Type:</span> ${article.type || 'Other'}
                                </div>
                            </div>
                        </div>
                        <div class="article-content">${formatContent(article.content, article.type)}</div>
                    </div>
                `;

                if (index < issueArticles.length - 1) {
                    allArticlesHTML += `<hr class="article-separator" />`;
                }
            });

            allArticlesHTML += `<p><a href="${createUrl('index.html')}">&laquo; Back to all issues</a></p>`;
            allArticlesHTML += generateFooter();
            
            // Apply fade transition
            contentDiv.classList.add('fade-out');
            
            setTimeout(() => {
                contentDiv.innerHTML = allArticlesHTML;
                contentDiv.classList.remove('fade-out');
            }, 150);
            
        } else {
            let articleListHTML = `
                <div class="article-header">
                    <div class="issue-title">
                        ${displayIssueName}
                        <a href="${createUrl('index.html', {issue: issueName, all: 'yes'})}" class="all-articles-link">Full View</a>
                        ${pdfPath ? `<a href="${pdfPath}" class="all-articles-link" target="_blank" style="margin-left: 10px;">PDF</a>` : ''}
                    </div>
                </div>
                <ul class="article-list">
            `;

            issueArticles.forEach(article => {
                const authorLinksHTML = article.author || '';
                articleListHTML += `
                    <li>
                        <div class="article-list-title">
                            <a href="${createUrl('index.html', {path: article.path})}" class="article-item-link" data-path="${article.path}">${article.title}</a>
                        </div>
                        <div class="article-list-meta">
                            ${authorLinksHTML ? `${authorLinksHTML} <span class="meta-separator">|</span> ` : ''}
                            ${article.type || ''}
                        </div>
                    </li>
                `;
            });

            articleListHTML += `
                </ul>
                <p><a href="${createUrl('index.html')}">&laquo; Back to all issues</a></p>
                <div class="article-navigation">
                    <div class="nav-links">
                        <div></div>
                        <div class="nav-pagination">
                            ${prevIssue ?
                                `<a href="${createUrl('index.html', {issue: prevIssue})}" class="nav-link-prev">Previous Issue</a>` :
                                `<span class="nav-link-disabled">Previous Issue</span>`
                            }
                            ${nextIssue ?
                                `<a href="${createUrl('index.html', {issue: nextIssue})}" class="nav-link-next">Next Issue</a>` :
                                `<span class="nav-link-disabled">Next Issue</span>`
                            }
                        </div>
                    </div>
                </div>
            `;
            articleListHTML += generateFooter();

            // Apply fade transition
            contentDiv.classList.add('fade-out');

            setTimeout(() => {
                contentDiv.innerHTML = articleListHTML;
                contentDiv.classList.remove('fade-out');
                
                // Add click event listeners to article items
                document.querySelectorAll('.article-item-link').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const path = this.getAttribute('data-path');
                        if (path) {
                            displayArticle(path);
                        }
                    });
                });
                
                // Add keyboard navigation indicators to issue navigation buttons
                addIssueNavigationIndicators();
                
                
                // Set focus to the content div to enable keyboard navigation without clicking
                // contentDiv.setAttribute('tabindex', '-1');
                // contentDiv.focus({preventScroll: true});
                enableUniversalKeyboardNavigation();
            }, 150);
        }
        
        // Update the browser history if this is a new navigation
        if (pushState) {
            window.history.pushState(
                { issue: issueName, displayType: 'issue', showAll: showAll },
                `Issue: ${displayIssueName}`,
                createUrl('index.html', showAll ? {issue: issueName, all: 'yes'} : {issue: issueName})
            );
        }
    });
}

function addIssueNavigationIndicators() {
    // Use multiple selector patterns to ensure we find the elements
    const prevLinkSelectors = [
        '.nav-link-prev:not(.nav-article-link)',
        '.nav-pagination .nav-link-prev'
    ];
    
    const nextLinkSelectors = [
        '.nav-link-next:not(.nav-article-link)',
        '.nav-pagination .nav-link-next'
    ];
    
    // Try to find the previous link using our selectors
    let prevLink = null;
    for (const selector of prevLinkSelectors) {
        const element = document.querySelector(selector);
        if (element && !element.classList.contains('nav-article-link') && 
            !element.classList.contains('nav-link-disabled')) {
            prevLink = element;
            break;
        }
    }
    
    // Try to find the next link using our selectors
    let nextLink = null;
    for (const selector of nextLinkSelectors) {
        const element = document.querySelector(selector);
        if (element && !element.classList.contains('nav-article-link') && 
            !element.classList.contains('nav-link-disabled')) {
            nextLink = element;
            break;
        }
    }
    
    // Add indicators if found and not already having indicators
    if (prevLink && !prevLink.querySelector('.keyboard-shortcut-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = '←';
        prevLink.appendChild(indicator);
    }
    
    if (nextLink && !nextLink.querySelector('.keyboard-shortcut-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'keyboard-shortcut-indicator';
        indicator.textContent = '→';
        nextLink.appendChild(indicator);
    }
}

// Display a specific article
function displayArticle(articlePath, pushState = true) {
    const contentDiv = document.getElementById('content');
    const match = articlePath.match(/^(.+?)\//);
    if (!match) {
        contentDiv.innerHTML = `<div class="error">Invalid article path: ${articlePath}</div>`;
        return;
    }

    const issueName = match[1];
    
    // Show loading indicator while content loads
    contentDiv.innerHTML = `<div class="loading">Loading...</div>`;

    loadIssueScript(issueName, (issueArticles) => {
        const article = issueArticles.find(item => item.path === articlePath);

        if (!article) {
            contentDiv.innerHTML = `
                <div class="error">
                    <p>The requested article "${articlePath}" could not be found.</p>
                    <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
                </div>
            `;
            return;
        }

        const pdfPath = getPdfPath(article.issue);
        const displayIssue = formatIssueForDisplay(article.issue); // Format for display

        issueArticles.sort((a, b) => {
            const getFileNumber = (path) => {
                const matches = path.match(/\/(\d+)\.txt$/);
                return matches ? parseInt(matches[1], 10) : 0;
            };
            return getFileNumber(a.path) - getFileNumber(b.path);
        });

        const currentIndex = issueArticles.findIndex(item => item.path === article.path);
        const prevArticle = currentIndex > 0 ? issueArticles[currentIndex - 1] : null;
        const nextArticle = currentIndex < issueArticles.length - 1 ? issueArticles[currentIndex + 1] : null;

        const { prevIssue, nextIssue } = getAdjacentIssues(article.issue);

        document.title = `${article.title} - Korean Periodicals Archive`;

        const hasExcessiveMetadata = 
            (article.date && article.date.includes('\n')) || 
            (article.author && article.author.includes('\n')) ||
            (article.magazine && article.magazine.includes('\n'));

        let articleHTML = '';

        if (hasExcessiveMetadata) {
            articleHTML = `
                <div class="article-header">
                    <div class="article-title">${article.title}</div>
                    <div class="article-meta">
                        <div><span class="meta-label">Issue:</span> 
                            <a href="${createUrl('index.html', {issue: article.issue})}" style="color: inherit; text-decoration: none;">
                                ${article.issue}
                            </a>
                            ${pdfPath ? `<a href="${pdfPath}" class="all-articles-link" target="_blank" style="margin-left: 10px; font-size: 0.8em;">PDF</a>` : ''}
                        </div>
                        ${article.type ? `
                        <div><span class="meta-label">Type:</span> 
                            <a href="${createUrl('index.html', {type: article.type})}" style="color: inherit; text-decoration: none;">
                                ${article.type}
                            </a>
                        </div>` : ''}
                    </div>
                    <div style="margin-top: 10px; color: #999; font-size: 0.9em;">
                        ${prevArticle ? 
                            `<a href="${createUrl('index.html', {path: prevArticle.path})}" class="nav-article-link" data-path="${prevArticle.path}" style="color: #999; text-decoration: none; margin-right: 15px;">« Previous Article</a>` : 
                            prevIssue ? 
                                `<a href="${createUrl('index.html', {issue: prevIssue})}" style="color: #999; text-decoration: none; margin-right: 15px;">« Previous Issue</a>` :
                                ``
                        }
                        ${nextArticle ? 
                            `<a href="${createUrl('index.html', {path: nextArticle.path})}" class="nav-article-link" data-path="${nextArticle.path}" style="color: #999; text-decoration: none;">Next Article »</a>` : 
                            nextIssue ? 
                                `<a href="${createUrl('index.html', {issue: nextIssue})}" style="color: #999; text-decoration: none;">Next Issue »</a>` :
                                ``
                        }
                    </div>
                </div>
            `;

            let combinedContent = article.content;

            if (article.author && article.author.includes('\n')) {
                combinedContent = `<div class="metadata-section"><strong>Author Information:</strong>\n${article.author}</div>\n\n${combinedContent}`;
            }

            if (article.date && article.date.includes('\n')) {
                combinedContent = `<div class="metadata-section"><strong>Additional Information:</strong>\n${article.date}</div>\n\n${combinedContent}`;
            }

            if (article.magazine && article.magazine.includes('\n')) {
                combinedContent = `<div class="metadata-section"><strong>Publication Information:</strong>\n${article.magazine}</div>\n\n${combinedContent}`;
            }

            articleHTML += `<div class="article-content">${formatContent(combinedContent, article.type)}</div>`;
        } else {
            const authorLinksHTML = article.author ? 
                (isEnglishMode() ? 
                    `<a href="${createUrl('index.html', {author: article.author})}" style="color: inherit; text-decoration: none;">${article.author}</a>` :
                    article.author.split(' ').map(name => 
                        `<a href="${createUrl('index.html', {author: name})}" style="color: inherit; text-decoration: none;">${name}</a>`
                    ).join(' ')
                ) : 'Unknown';

            articleHTML = `
                <div class="article-header">
                    <div class="article-title">${article.title}</div>
                    <div class="article-meta">
                        <div><span class="meta-label">Author:</span> ${article.author || 'Unknown'}</div>
                        <div><span class="meta-label">Publication:</span> ${article.magazine} (${article.date})</div>
                        <div><span class="meta-label">Type:</span> ${article.type || 'Other'}</div>
                        <div><span class="meta-label">Issue:</span> 
                            <a href="${createUrl('index.html', {issue: article.issue})}" style="color: inherit; text-decoration: none;">
                                ${displayIssue}
                            </a>
                            ${pdfPath ? `<a href="${pdfPath}" class="all-articles-link" target="_blank" style="margin-left: 10px; font-size: 0.8em;">PDF</a>` : ''}
                        </div>
                    </div>
                    <div style="margin-top: 10px; color: #999; font-size: 0.9em;">
                        ${prevArticle ? 
                            `<a href="${createUrl('index.html', {path: prevArticle.path})}" class="nav-article-link" data-path="${prevArticle.path}" style="color: #999; text-decoration: none; margin-right: 15px;">« Previous Article</a>` : 
                            prevIssue ? 
                                `<a href="${createUrl('index.html', {issue: prevIssue})}" style="color: #999; text-decoration: none; margin-right: 15px;">« Previous Issue</a>` :
                                ``
                        }
                        ${nextArticle ? 
                            `<a href="${createUrl('index.html', {path: nextArticle.path})}" class="nav-article-link" data-path="${nextArticle.path}" style="color: #999; text-decoration: none;">Next Article »</a>` : 
                            nextIssue ? 
                                `<a href="${createUrl('index.html', {issue: nextIssue})}" style="color: #999; text-decoration: none;">Next Issue »</a>` :
                                ``
                        }
                    </div>
                </div>
                <div class="article-content">${formatContent(article.content, article.type)}</div>
            `;
        }

        articleHTML += `
            <div class="article-navigation">
                <div class="nav-links">
                    <a href="${createUrl('index.html', {issue: article.issue})}" class="nav-link-issue">&laquo; Back to ${displayIssue}</a>
                    <div class="nav-pagination">
                        ${prevArticle ? 
                            `<a href="${createUrl('index.html', {path: prevArticle.path})}" class="nav-article-link nav-link-prev" data-path="${prevArticle.path}">Previous Article</a>` : 
                            prevIssue ? 
                                `<a href="${createUrl('index.html', {issue: prevIssue})}" class="nav-link-prev">Previous Issue</a>` :
                                `<span class="nav-link-disabled">Previous Article</span>`
                        }
                        ${nextArticle ? 
                            `<a href="${createUrl('index.html', {path: nextArticle.path})}" class="nav-article-link nav-link-next" data-path="${nextArticle.path}">Next Article</a>` : 
                            nextIssue ? 
                                `<a href="${createUrl('index.html', {issue: nextIssue})}" class="nav-link-next">Next Issue</a>` :
                                `<span class="nav-link-disabled">Next Article</span>`
                        }
                    </div>
                </div>
            </div>
        `;

        // Fade out, update content, then fade in
        contentDiv.classList.add('fade-out');
        
        setTimeout(() => {
            contentDiv.innerHTML = articleHTML;
            
            // Add event listeners to article navigation links
            addArticleNavigationListeners();
            
            // Add keyboard navigation indicators
            addKeyboardNavigationIndicators();
            
            // Fade back in
            contentDiv.classList.remove('fade-out');
            
            // If this is client-side navigation, scroll to top
            window.scrollTo(0, 0);
        }, 150);

        // Update the URL if this is client-side navigation
        if (pushState) {
            window.history.pushState(
                { path: articlePath, displayType: 'article' }, 
                `${article.title}`, 
                createUrl('index.html', {path: articlePath})
            );
        }
    });
}

function addArticleNavigationListeners() {
    // Find all navigation links for articles
    const articleLinks = document.querySelectorAll('.nav-article-link');
    
    // Add click event listeners to each link
    articleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('data-path');
            if (path) {
                displayArticle(path);
            }
        });
    });
}

function handlePopState(event) {
    if (event.state) {
        if (event.state.displayType === 'article' && event.state.path) {
            // User navigated back/forward to an article
            displayArticle(event.state.path, false);
        } else if (event.state.displayType === 'issue' && event.state.issue) {
            // User navigated back/forward to an issue list
            displayIssueArticles(event.state.issue, false);
        } else {
            // Default: reload the page to handle other states
            window.location.reload();
        }
    } else {
        // No state information, reload the page
        window.location.reload();
    }
}

// Display articles by a specific author
// Update the displayAuthorArticles function
// Note: This function doesn't need to change its filtering behavior,
// since when in English mode, full names are used as the author parameter
function displayAuthorArticles(authorName) {
    const contentDiv = document.getElementById('content');
    
    // Filter articles by author
    const authorArticles = ARTICLES.filter(item => 
        item.author && item.author.includes(authorName)
    ).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    
    if (authorArticles.length === 0) {
        contentDiv.innerHTML = `
            <div class="error">
                <p>No articles found by author "${authorName}".</p>
                <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
            </div>
        `;
        return;
    }
    
    let articleListHTML = `
        <div class="article-header">
            <div class="issue-title">Articles by ${authorName}</div>
        </div>
        <ul class="article-list">
    `;
    
    authorArticles.forEach(article => {
        // Get PDF path for this issue
        const pdfPath = getPdfPath(article.issue);
        
        articleListHTML += `
            <li>
                <div class="article-list-title">
                    <a href="${createUrl('index.html', {path: article.path})}">${article.title}</a>
                </div>
                <div class="article-list-meta">
                    <a href="${createUrl('index.html', {issue: article.issue})}">${article.issue}</a>
                    ${pdfPath ? `<a href="${pdfPath}" class="pdf-link" target="_blank" style="font-size: 0.8em; padding: 1px 4px;">PDF</a>` : ''}
                    ${article.type ? `<a href="${createUrl('index.html', {type: article.type})}">${article.type}</a>` : ''}
                </div>
            </li>
        `;
    });
    
    articleListHTML += `
        </ul>
        <p><a href="${createUrl('index.html')}">&laquo; Back to all issues</a></p>
    `;
    
    contentDiv.innerHTML = articleListHTML;
}

// Display articles by a specific type
function displayTypeArticles(typeName) {
    const contentDiv = document.getElementById('content');
    
    // Filter articles by type
    const typeArticles = ARTICLES.filter(item => 
        (item.type || 'Other') === typeName
    ).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    
    if (typeArticles.length === 0) {
        contentDiv.innerHTML = `
            <div class="error">
                <p>No articles found of type "${typeName}".</p>
                <p><a href="${createUrl('index.html')}">Return to issue list</a></p>
            </div>
        `;
        return;
    }
    
    let articleListHTML = `
        <div class="article-header">
            <div class="issue-title">Articles of type: ${typeName}</div>
        </div>
        <ul class="article-list">
    `;
    
    typeArticles.forEach(article => {
        // Get PDF path for this issue
        const pdfPath = getPdfPath(article.issue);
        
        articleListHTML += `
            <li>
                <div class="article-list-title">
                    <a href="${createUrl('index.html', {path: article.path})}">${article.title}</a>
                </div>
                <div class="article-list-meta">
                    ${article.author ? article.author.split(' ').map(name => 
                        `<a href="${createUrl('index.html', {author: name})}">${name}</a>`
                    ).join(' ') : ''}
                    <a href="${createUrl('index.html', {issue: article.issue})}">${article.issue}</a>
                    ${pdfPath ? `<a href="${pdfPath}" class="pdf-link" target="_blank" style="font-size: 0.8em; padding: 1px 4px;">PDF</a>` : ''}
                    ${article.type ? `<a href="${createUrl('index.html', {type: article.type})}">${article.type}</a>` : ''}
                </div>
            </li>
        `;
    });
    
    articleListHTML += `
        </ul>
        <p><a href="${createUrl('index.html')}">&laquo; Back to all issues</a></p>
    `;
    
    contentDiv.innerHTML = articleListHTML;
}

// Main function to determine what to display
function initializeDisplay() {
    const requestedPath = getUrlParam('path');
    const requestedIssue = getUrlParam('issue');
    const requestedAuthor = getUrlParam('author');
    const requestedType = getUrlParam('type');
    
    if (requestedPath) {
        // Display specific article
        displayArticle(requestedPath);
    } else if (requestedIssue) {
        // Display articles in a specific issue
        displayIssueArticles(requestedIssue);
    } else if (requestedAuthor) {
        // Display articles by a specific author
        displayAuthorArticles(requestedAuthor);
    } else if (requestedType) {
        // Display articles of a specific type
        displayTypeArticles(requestedType);
    } else {
        // Display list of issues
        displayIssueList();
    }
}


// Variables for swipe detection
let touchStartX = 0;
let touchEndX = 0;
const MIN_SWIPE_DISTANCE = 50; // Minimum distance in pixels to register as a swipe

// Function to set up swipe navigation for mobile
function setupSwipeNavigation() {
    const contentDiv = document.getElementById('content');
    
    // Add touch event listeners to the content div
    contentDiv.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    contentDiv.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    // Function to determine swipe direction and navigate accordingly
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        // Ignore small movements to prevent accidental navigation
        if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) {
            return;
        }
        
        if (swipeDistance > 0) {
            // Swipe right: go to previous article or issue
            
            // First try article navigation
            const prevArticleLink = document.querySelector('.nav-article-link.nav-link-prev');
            if (prevArticleLink) {
                const path = prevArticleLink.getAttribute('data-path');
                if (path) {
                    displayArticle(path);
                    return;
                }
            }
            
            // If no article navigation or not on article page, try issue navigation
            const prevIssueLink = document.querySelector('.nav-link-prev:not(.nav-article-link)');
            if (prevIssueLink && !prevIssueLink.classList.contains('nav-link-disabled')) {
                prevIssueLink.click();
                return;
            }
        } else {
            // Swipe left: go to next article or issue
            
            // First try article navigation
            const nextArticleLink = document.querySelector('.nav-article-link.nav-link-next');
            if (nextArticleLink) {
                const path = nextArticleLink.getAttribute('data-path');
                if (path) {
                    displayArticle(path);
                    return;
                }
            }
            
            // If no article navigation or not on article page, try issue navigation
            const nextIssueLink = document.querySelector('.nav-link-next:not(.nav-article-link)');
            if (nextIssueLink && !nextIssueLink.classList.contains('nav-link-disabled')) {
                nextIssueLink.click();
                return;
            }
        }
    }
}

// Add visual indicators for keyboard navigation (optional but helpful)
function addKeyboardNavigationIndicators() {
    // Add indicators to the navigation links when they're created
    const prevLink = document.querySelector('.nav-article-link.nav-link-prev');
    const nextLink = document.querySelector('.nav-article-link.nav-link-next');
    
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

function universalKeyHandler(e) {
    // Skip for form elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    
    if (e.key === 'ArrowLeft') {
        // Try article navigation first
        const articleLink = document.querySelector('.nav-article-link.nav-link-prev');
        if (articleLink) {
            e.preventDefault();
            const path = articleLink.getAttribute('data-path');
            if (path) {
                displayArticle(path);
                return;
            }
        }
        
        // Then try issue navigation
        const issueLink = document.querySelector('.nav-link-prev:not(.nav-article-link):not(.nav-link-disabled)');
        if (issueLink) {
            e.preventDefault();
            issueLink.click();
            return;
        }
    } 
    else if (e.key === 'ArrowRight') {
        // Same pattern for right arrow
        const articleLink = document.querySelector('.nav-article-link.nav-link-next');
        if (articleLink) {
            e.preventDefault();
            const path = articleLink.getAttribute('data-path');
            if (path) {
                displayArticle(path);
                return;
            }
        }
        
        const issueLink = document.querySelector('.nav-link-next:not(.nav-article-link):not(.nav-link-disabled)');
        if (issueLink) {
            e.preventDefault();
            issueLink.click();
            return;
        }
    }
}

function enableUniversalKeyboardNavigation() {
    
    // Remove any existing handlers to prevent duplicates
    document.removeEventListener('keydown', universalKeyHandler, true);
    
    // Add a single consistent handler at document level with capture phase
    document.addEventListener('keydown', universalKeyHandler, true);
    
    // Ensure document or body has focus for Firefox
    if (navigator.userAgent.indexOf("Firefox") !== -1) {
        document.body.setAttribute('tabindex', '0');
        document.body.focus();
    }
}

// Run when page loads
window.onload = function () {
    
    initLanguageToggle();
    
    // Set document title from site info if available
    if (window.SITE_INFO && window.SITE_INFO.title) {
        document.title = window.SITE_INFO.title;
    }

    // Add event listener for browser back/forward buttons
    window.addEventListener('popstate', handlePopState);
    
    setupSwipeNavigation();
    
    // Capture keys even when window isn't explicitly focused
    window.addEventListener('focus', function() {
        // Check if we have navigation elements and reinitialize if needed
        const hasNavElements = 
            document.querySelector('.nav-article-link.nav-link-prev') || 
            document.querySelector('.nav-article-link.nav-link-next') ||
            document.querySelector('.nav-link-prev:not(.nav-article-link)') ||
            document.querySelector('.nav-link-next:not(.nav-article-link)');
        
    });
    
    
    
    document.addEventListener('keydown', function(e) {
        // This will capture all keydown events regardless of focus
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && 
            document.querySelector('.nav-link-prev, .nav-link-next')) {
            // Force focus on the content to activate navigation
            const contentDiv = document.getElementById('content');
            if (contentDiv) {
                contentDiv.setAttribute('tabindex', '-1');
                contentDiv.focus({preventScroll: true});
            }
        }
    }, true); // Using capture phase to catch events early

    // Try to set initial focus to capture keyboard events
    window.focus();
    document.body.focus();

    const pdfScript = document.createElement('script');
    pdfScript.src = 'data/pdfs.js';
    pdfScript.onload = () => {
        initializeDisplay(); 
        
        // After a delay, check navigation elements
        setTimeout(() => {
            const hasNavElements = 
                document.querySelector('.nav-article-link.nav-link-prev') || 
                document.querySelector('.nav-article-link.nav-link-next') ||
                document.querySelector('.nav-link-prev:not(.nav-article-link)') ||
                document.querySelector('.nav-link-next:not(.nav-article-link)');
            
            if (hasNavElements) {
                // Make the container focusable
                const contentDiv = document.getElementById('content');
                if (contentDiv) {
                    contentDiv.setAttribute('tabindex', '-1');
                    contentDiv.focus({preventScroll: true});
                }
                
            }
        }, 500);
    };
    pdfScript.onerror = () => {
        console.warn('⚠️ Failed to load pdfs.js. PDF links may not appear.');
        initializeDisplay();
        
        // Same delay check even if PDF loading failed
        setTimeout(() => {
            const hasNavElements = 
                document.querySelector('.nav-article-link.nav-link-prev') || 
                document.querySelector('.nav-article-link.nav-link-next') ||
                document.querySelector('.nav-link-prev:not(.nav-article-link)') ||
                document.querySelector('.nav-link-next:not(.nav-article-link)');
            
            if (hasNavElements) {
                // Make the container focusable
                const contentDiv = document.getElementById('content');
                if (contentDiv) {
                    contentDiv.setAttribute('tabindex', '-1');
                    contentDiv.focus({preventScroll: true});
                }
                
            }
        }, 500);
    };

    document.body.appendChild(pdfScript);
    enableUniversalKeyboardNavigation();
    setTimeout(enableUniversalKeyboardNavigation, 500);

};