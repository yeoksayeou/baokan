// Perform the search
function performSearch() {
  // Show results per page selectors when performing a search
  document.querySelector('.results-header .results-per-page').style.display = 'block';
  document.querySelector('.results-footer').style.display = 'block';
  
  // Rest of the performSearch function remains the same...
  // Validate year range
  if (!validateYearRange()) {
    return;
  }
  
  // Check if advanced search is visible
  const advancedSearchVisible = !document.getElementById('advancedSearch').classList.contains('hidden');
  
  // Update URL with current search parameters
  updateURL();
  
  // Get main search query - only if advanced search is not visible
  let mainQuery = '';
  if (!advancedSearchVisible) {
    mainQuery = document.getElementById('searchBox').value.trim();
  }
  
  // Get advanced filter values - only if advanced search is visible
  let titleFilter = '';
  let authorFilter = '';
  let typeFilter = '';
  let startYearFilter = '';
  let endYearFilter = '';
  let term1 = '';
  let operator1 = 'AND';
  let term2 = '';
  let operator2 = 'AND';
  let term3 = '';
  
  if (advancedSearchVisible) {
    titleFilter = document.getElementById('titleFilter').value.trim();
    authorFilter = document.getElementById('authorFilter').value.trim();
    typeFilter = document.getElementById('typeFilter').value;
    startYearFilter = document.getElementById('startYearFilter').value;
    endYearFilter = document.getElementById('endYearFilter').value;
    
    // Get multi-term search values
    term1 = document.getElementById('searchTerm1').value.trim();
    operator1 = document.getElementById('operator').value;
    term2 = document.getElementById('searchTerm2').value.trim();
    operator2 = document.getElementById('operator2').value;
    term3 = document.getElementById('searchTerm3').value.trim();
  }
  
  // Check if we have any search criteria
  const hasMainQuery = mainQuery.length > 0;
  const hasAdvancedFilters = titleFilter || authorFilter || typeFilter || startYearFilter || endYearFilter;
  const hasMultiTermSearch = term1 || term2 || term3;
  
  // Allow empty search to show all results - no need to check if any search criteria exists
  
  // Display loading state
  resultsDiv.innerHTML = `<div class="loading">${translations[currentLanguage].loading}</div>`;
  
  // Clear previous results
  filteredResults = [];
  currentPage = 1;
  
  // Use setTimeout to allow the loading state to be displayed
  setTimeout(() => {
    // Search in articles
    for (const article of ARTICLES) {
      // Apply filters
      if (!matchesFilters(article, titleFilter, authorFilter, typeFilter, startYearFilter, endYearFilter)) {
        continue;
      }
      
      // Apply main search query if present
      if (hasMainQuery) {
        // Check if query is an exact phrase search (enclosed in quotes)
        let isExactPhrase = false;
        let searchTerms = mainQuery;
        
        if (mainQuery.startsWith('"') && mainQuery.endsWith('"') && mainQuery.length > 2) {
          isExactPhrase = true;
          searchTerms = mainQuery.substring(1, mainQuery.length - 1);
        }
        
        if (isExactPhrase) {
          // Exact phrase search
          const pattern = new RegExp(escapeRegExp(searchTerms), 'gi');
          if (!(pattern.test(article.content) || 
                pattern.test(article.title) || 
                pattern.test(article.author))) {
            continue;
          }
        } else {
          // AND search for multiple terms
          const terms = searchTerms.split(/\s+/);
          let allTermsFound = true;
          
          for (const term of terms) {
            if (term.length === 0) continue;
            
            const pattern = new RegExp(escapeRegExp(term), 'gi');
            if (!(pattern.test(article.content) || 
                  pattern.test(article.title) || 
                  pattern.test(article.author))) {
              allTermsFound = false;
              break;
            }
          }
          
          if (!allTermsFound) {
            continue;
          }
        }
      }
      
      // Apply multi-term search if present
      if (hasMultiTermSearch && !matchesMultiTermSearch(article, term1, operator1, term2, operator2, term3)) {
        continue;
      }
      
      // If we got here, the article matches all search criteria
      // Find all matches and their context for highlighting
      let matchResult = { contexts: [], totalMatchCount: 0, hasTitleMatch: false };
      
      if (hasMainQuery) {
        // For exact phrase search
        if (mainQuery.startsWith('"') && mainQuery.endsWith('"') && mainQuery.length > 2) {
          const searchTerm = mainQuery.substring(1, mainQuery.length - 1);
          matchResult = findMatches(article.content, searchTerm, article.title);
        } else {
          // For regular search, highlight the first term
          const firstTerm = mainQuery.split(/\s+/)[0];
          if (firstTerm) {
            matchResult = findMatches(article.content, firstTerm, article.title);
          }
        }
      } else if (term1) {
        // If no main query, use the first multi-term for highlighting
        matchResult = findMatches(article.content, term1, article.title);
      } else {
        // No search term to highlight, but article matches filters
        // Add with empty matches array
        matchResult = { contexts: [], totalMatchCount: 0, hasTitleMatch: false };
      }
      
      // Check for title match with title filter
      if (titleFilter && article.title.toLowerCase().includes(titleFilter.toLowerCase())) {
        matchResult.hasTitleMatch = true;
      }
      
      filteredResults.push({
        article: article,
        contexts: matchResult.contexts,
        totalMatchCount: matchResult.totalMatchCount,
        hasTitleMatch: matchResult.hasTitleMatch
      });
    }
    
    // Sort results:
    // 1. Documents with title matches first
    // 2. Then by number of matches (descending) when using search terms
    // 3. Otherwise, sort by date (newest first) then title
    if ((hasMainQuery || hasMultiTermSearch) && filteredResults.some(r => r.totalMatchCount > 0)) {
      filteredResults.sort((a, b) => {
        // Check for title matches
        if (a.hasTitleMatch && !b.hasTitleMatch) return -1;
        if (!a.hasTitleMatch && b.hasTitleMatch) return 1;
        
        // If both have or don't have title matches, sort by match count
        return b.totalMatchCount - a.totalMatchCount;
      });
    } else {
      // Sort by date if available, otherwise by title
      filteredResults.sort((a, b) => {
        // Extract years for comparison
        const yearA = a.article.date ? parseInt(a.article.date.match(/(\d{4})/)?.[1] || 0) : 0;
        const yearB = b.article.date ? parseInt(b.article.date.match(/(\d{4})/)?.[1] || 0) : 0;
        
        if (yearA !== yearB) return yearB - yearA; // Latest first
        return a.article.title.localeCompare(b.article.title); // Then alphabetically
      });
    }
    
    // Display results
    displayResults();
  }, 10);
}