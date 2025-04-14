// Display the search results with pagination
function displayResults() {
  const t = translations[currentLanguage];
  
  // Show results per page selectors when search is active
  document.querySelector('.results-header .results-per-page').style.display = 'block';
  document.querySelector('.results-footer').style.display = 'block';
  
  // Display search description with removable terms
  const searchDescription = generateSearchDescription(true);
  
  // Display stats with search description
  let statsHTML = `${searchDescription}<br><br>`;
  
  if (filteredResults.length === 0) {
    // Still display search parameters even with no results
    statsDiv.innerHTML = statsHTML;
    resultsDiv.innerHTML = `<p class="no-results">${t.noResults}</p>`;
    paginationDiv.innerHTML = '';
    
    // Add event listeners for the remove buttons
    setTimeout(() => {
      document.querySelectorAll('.remove-term').forEach(button => {
        button.addEventListener('click', function() {
          const paramType = this.getAttribute('data-param');
          
          // Clear the corresponding input
          switch (paramType) {
            case 'mainQuery':
              document.getElementById('searchBox').value = '';
              break;
            case 'titleFilter':
              document.getElementById('titleFilter').value = '';
              break;
            case 'authorFilter':
              document.getElementById('authorFilter').value = '';
              break;
            case 'typeFilter':
              document.getElementById('typeFilter').value = '';
              break;
            case 'startYearFilter':
              document.getElementById('startYearFilter').value = '';
              break;
            case 'endYearFilter':
              document.getElementById('endYearFilter').value = '';
              break;
            case 'term1':
              document.getElementById('searchTerm1').value = '';
              break;
            case 'term2':
              document.getElementById('searchTerm2').value = '';
              break;
            case 'term3':
              document.getElementById('searchTerm3').value = '';
              break;
          }
          
          // Check if all search parameters are now empty
          const allEmpty = isAllSearchEmpty();
          console.log('Getting ready to check if all empty')
          if (allEmpty) {
            // Reset search which will clear the URL completely
            console.log('ALL EMPTY')
            resetSearch();
          } else {
            console.log('NOT ALL EMPTY')
            // Re-run search with updated parameters
            performSearch();
          }
        });
      });
    }, 0);
    
    return;
  }
  
  // Count total matches and hits per year
  let totalMatches = 0;
  const yearStats = {};
  
  filteredResults.forEach(result => {
    totalMatches += result.totalMatchCount;
    
    // Extract year from date
    const article = result.article;
    let year = "Unknown";
    if (article.date) {
      const match = article.date.match(/(\d{4})/);
      if (match) {
        year = match[1];
      }
    }
    
    if (!yearStats[year]) {
      yearStats[year] = {
        documents: 0,
        matches: 0
      };
    }
    
    yearStats[year].documents++;
    yearStats[year].matches += result.totalMatchCount;
  });
  
  // Update the stats text for title/filter searches
  if (totalMatches === 0 && filteredResults.length > 0) {
    // For searches that find documents but no content matches (title searches or filters)
    statsHTML += `<strong>${t.resultsStats}</strong> ${filteredResults.length} ${t.documentsFound}<br>`;
  } else {
    statsHTML += `<strong>${t.resultsStats}</strong> ${filteredResults.length} ${t.docs} (${totalMatches} ${t.matchesFound})<br>`;
  }
  
  // Add year stats if we have content matches
  if (totalMatches > 0) {
    statsHTML += `<strong>${t.matchesByYear}</strong> `;
    
    // Sort years
    const sortedYears = Object.keys(yearStats).sort();
    
    // Add year stats with clickable + sign in a grey box next to the year (no brackets)
    statsHTML += sortedYears.map(year => {
      if (year === "Unknown") {
        return `${year}: ${yearStats[year].documents} ${t.docs} (${yearStats[year].matches} ${t.matchesFound})`;
      } else {
        return `${year} <span class="add-year-filter" data-year="${year}" title="${t.filterByYear}">+</span>: ${yearStats[year].documents} ${t.docs} (${yearStats[year].matches} ${t.matchesFound})`;
      }
    }).join(' | ');
  }
  
  statsDiv.innerHTML = statsHTML;
  
  // Add event listeners to year filter buttons
  setTimeout(() => {
    document.querySelectorAll('.add-year-filter').forEach(button => {
      button.addEventListener('click', function() {
        const year = this.getAttribute('data-year');
        
        // Set the year range in the advanced search
        if (!document.getElementById('advancedSearch').classList.contains('hidden')) {
          // If advanced search is already visible, just update fields
          document.getElementById('startYearFilter').value = year;
          document.getElementById('endYearFilter').value = year;
        } else {
          // If advanced search is hidden, show it first
          toggleAdvancedSearch();
          // Then update the year fields
          document.getElementById('startYearFilter').value = year;
          document.getElementById('endYearFilter').value = year;
        }
        
        // Run the search
        performSearch();
      });
    });
  }, 0);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, filteredResults.length);
  
  // Clear previous results
  resultsDiv.innerHTML = '';
  
  // Display results for current page
  for (let i = startIndex; i < endIndex; i++) {
    const result = filteredResults[i];
    const article = result.article;
    
    // Calculate the result number (1-based)
    const resultNumber = i + 1;
    
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('result');
    
    // Add low-relevance class for items with only one match
    if (result.totalMatchCount === 1 && !result.hasTitleMatch) {
      resultDiv.classList.add('low-relevance');
    }
    
    // Add highlight class for items with title matches
    if (result.hasTitleMatch) {
      resultDiv.classList.add('title-match');
    }
    
    // Create result header with title and metadata
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('result-header');
    
    // Add the result number before the title
    const numberSpan = document.createElement('span');
    numberSpan.classList.add('result-number');
    numberSpan.textContent = `${resultNumber}. `;
    headerDiv.appendChild(numberSpan);
    
    const titleDiv = document.createElement('a');
    titleDiv.classList.add('result-title');
    titleDiv.textContent = article.title;
    
    // CHANGE: Create a link to index.html with path parameter instead of linking to raw file
    // Check if createUrl is available, otherwise use a simple URL construction
    if (typeof createUrl === 'function') {
      titleDiv.href = createUrl('index.html', {path: article.path});
    } else {
      // Fallback method to create the URL with the path parameter
      const url = new URL('index.html', window.location.href);
      url.searchParams.set('path', article.path);
      
      // Preserve language parameter if it exists
      const langParam = new URLSearchParams(window.location.search).get('lang');
      if (langParam === 'en') {
        url.searchParams.set('lang', 'en');
      }
      
      titleDiv.href = url.toString();
    }
    
    headerDiv.appendChild(titleDiv);
    
    const metaDiv = document.createElement('div');
    metaDiv.classList.add('result-meta');
    metaDiv.innerHTML = `
      ${article.issue_number ? `<strong>${t.issueLabel}</strong> ${article.issue_number}` : ''}
      ${article.date ? `<strong>${t.dateLabel}</strong> ${article.date}` : ''}
      ${article.author ? `<strong>${t.authorResultLabel}</strong> ${article.author}` : ''}
      ${article.type ? `<strong>${t.typeResultLabel}</strong> ${article.type}` : ''}
    `;
    headerDiv.appendChild(metaDiv);
    
    resultDiv.appendChild(headerDiv);
    
    // Create result content with match contexts
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('result-content');
    
    // Find the query to highlight
    let queryToHighlight = document.getElementById('searchBox').value.trim();
    
    // If advanced search is active, check the multi-term fields instead
    if (document.getElementById('advancedSearch').classList.contains('hidden') === false) {
      queryToHighlight = document.getElementById('searchTerm1').value.trim();
    }
    
    // If it's an exact phrase search, extract the phrase
    if (queryToHighlight.startsWith('"') && queryToHighlight.endsWith('"') && queryToHighlight.length > 2) {
      queryToHighlight = queryToHighlight.substring(1, queryToHighlight.length - 1);
    } else if (queryToHighlight.includes(' ')) {
      // If it has multiple terms, just use the first term for highlighting
      queryToHighlight = queryToHighlight.split(' ')[0];
    }
    
    // Highlight title matches if present
    if (result.hasTitleMatch && queryToHighlight) {
      const titleElement = headerDiv.querySelector('.result-title');
      const pattern = new RegExp(`(${escapeRegExp(queryToHighlight)})`, 'gi');
      titleElement.innerHTML = titleElement.textContent.replace(pattern, '<span class="highlight">$1</span>');
    }
    
    // Add each match context
    result.contexts.slice(0, 3).forEach(match => {
      const contextDiv = document.createElement('div');
      contextDiv.classList.add('result-context');
      
      // Highlight the matched text
      let highlightedContext = match.context;
      if (queryToHighlight) {
        const pattern = new RegExp(`(${escapeRegExp(queryToHighlight)})`, 'gi');
        highlightedContext = match.context.replace(pattern, '<span class="highlight">$1</span>');
      }
      
      contextDiv.innerHTML = `...${highlightedContext}...`;
      contentDiv.appendChild(contextDiv);
    });
    
    // Show total matches information
    if (result.totalMatchCount > 0) {
      const totalMatchesDiv = document.createElement('div');
      
      // If we're showing fewer contexts than exist, clarify that we're showing a subset
      if (result.contexts.length > 3) {
        totalMatchesDiv.textContent = `${result.totalMatchCount} ${t.totalMatches} (showing 3 contexts)`;
      } else {
        totalMatchesDiv.textContent = `${result.totalMatchCount} ${t.totalMatches}`;
      }
      
      contentDiv.appendChild(totalMatchesDiv);
    }
    
    resultDiv.appendChild(contentDiv);
    resultsDiv.appendChild(resultDiv);
  }
  
  // Create pagination controls
  createPagination(totalPages);
  
  // Scroll to stats section to show search parameters and numbers
  if (statsDiv) {
    statsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// END OF DISPLAY RESULTS FUNCTION ---------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------




// Create pagination controls
function createPagination(totalPages) {
  paginationDiv.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  const t = translations[currentLanguage];
  
  // Previous button
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = t.previous;
    prevButton.onclick = function() {
      currentPage--;
      displayResults();
      window.scrollTo(0, 0);
    };
    paginationDiv.appendChild(prevButton);
  }
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    if (i === currentPage) {
      pageButton.style.backgroundColor = '#3367d6';
    }
    pageButton.onclick = function() {
      currentPage = i;
      displayResults();
      window.scrollTo(0, 0);
    };
    paginationDiv.appendChild(pageButton);
  }
  
  // Next button
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = t.next;
    nextButton.onclick = function() {
      currentPage++;
      displayResults();
      window.scrollTo(0, 0);
    };
    paginationDiv.appendChild(nextButton);
  }
  
  // Add Back to Top button
  const topButton = document.createElement('button');
  topButton.textContent = t.scrollToTop;
  topButton.style.marginLeft = '20px';
  topButton.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  paginationDiv.appendChild(topButton);
}