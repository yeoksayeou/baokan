// Check if article matches all filters
function matchesFilters(article, titleFilter, authorFilter, typeFilter, startYearFilter, endYearFilter) {
  // Check title filter
  if (titleFilter && !new RegExp(escapeRegExp(titleFilter), 'gi').test(article.title)) {
    return false;
  }
  
  // Check author filter
  if (authorFilter && !new RegExp(escapeRegExp(authorFilter), 'gi').test(article.author)) {
    return false;
  }
  
  // Check type filter
  if (typeFilter && article.type !== typeFilter) {
    return false;
  }
  
  // Extract year from date
  let year = null;
  if (article.date) {
    const match = article.date.match(/(\d{4})/);
    if (match) {
      year = parseInt(match[1]);
    }
  }
  
  // Check if year filters are applied
  const hasYearFilters = startYearFilter || endYearFilter;
  
  // If year is null (Unknown) and year filters are applied, exclude this article
  if (year === null && hasYearFilters) {
    return false;
  }
  
  // Check year range
  if (year !== null) {
    if (startYearFilter && year < parseInt(startYearFilter)) {
      return false;
    }
    
    if (endYearFilter && year > parseInt(endYearFilter)) {
      return false;
    }
  }
  
  return true;
}

// Check if article matches multi-term search
function matchesMultiTermSearch(article, term1, operator1, term2, operator2, term3) {
  if (!term1) return true; // No multi-term search criteria
  
  // Check first term
  const matchesTerm1 = term1 ? new RegExp(escapeRegExp(term1), 'gi').test(article.content) : false;
  
  // If only first term, return its match result
  if (!term2) return matchesTerm1;
  
  // Check second term
  const matchesTerm2 = term2 ? new RegExp(escapeRegExp(term2), 'gi').test(article.content) : false;
  
  // Check first operation
  let operationResult;
  if (operator1 === 'AND') {
    operationResult = matchesTerm1 && matchesTerm2;
  } else { // OR
    operationResult = matchesTerm1 || matchesTerm2;
  }
  
  // If no third term, return result of first operation
  if (!term3) return operationResult;
  
  // Check third term
  const matchesTerm3 = term3 ? new RegExp(escapeRegExp(term3), 'gi').test(article.content) : false;
  
  // Apply second operation
  if (operator2 === 'AND') {
    return operationResult && matchesTerm3;
  } else { // OR
    return operationResult || matchesTerm3;
  }
}

// Find all matches with context, including title matches
function findMatches(text, query, title = '') {
  const pattern = new RegExp(escapeRegExp(query), 'gi');
  const matches = [];
  let match;
  let allMatchesCount = 0;
  let hasTitleMatch = false;
  
  // Check for matches in title if provided
  if (title) {
    const titlePattern = new RegExp(escapeRegExp(query), 'gi');
    hasTitleMatch = titlePattern.test(title);
  }
  
  // Find all matches
  while ((match = pattern.exec(text)) !== null) {
    allMatchesCount++;
    
    // Create context for display (limit to avoid too many similar contexts)
    // We group nearby matches to avoid duplicating contexts
    const startPos = Math.max(0, match.index - 50);
    const endPos = Math.min(text.length, match.index + query.length + 50);
    
    // Check if this match is close to an existing context
    let foundExistingContext = false;
    for (let i = 0; i < matches.length; i++) {
      if (Math.abs(match.index - matches[i].position) < 100) {
        // Update existing context if needed to include this match
        matches[i].matchCount++;
        foundExistingContext = true;
        break;
      }
    }
    
    if (!foundExistingContext) {
      // Create a new context
      const context = text.substring(startPos, endPos);
      matches.push({
        position: match.index,
        context: context,
        matched: match[0],
        matchCount: 1
      });
    }
  }
  
  // Store the total count of all matches in the text
  return {
    contexts: matches,
    totalMatchCount: allMatchesCount,
    hasTitleMatch: hasTitleMatch
  };
}

// Generate search description with optional remove buttons
function generateSearchDescription(includeRemoveButtons = false) {
  const t = translations[currentLanguage];
  
  // Get search parameters
  const mainQuery = document.getElementById('searchBox').value.trim();
  
  // Check if advanced search is visible
  const advancedSearchVisible = !document.getElementById('advancedSearch').classList.contains('hidden');
  
  // Get advanced parameters only if advanced search is visible
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
    term1 = document.getElementById('searchTerm1').value.trim();
    operator1 = document.getElementById('operator').value;
    term2 = document.getElementById('searchTerm2').value.trim();
    operator2 = document.getElementById('operator2').value;
    term3 = document.getElementById('searchTerm3').value.trim();
  }
  
  // Build description
  let description = `<strong>${t.searchingFor}</strong> `;
  let hasParameters = false;
  
  // Helper function to create a term with remove button
  const createTermWithRemoveButton = (text, paramType, paramValue) => {
    if (includeRemoveButtons) {
      return `<span class="search-term">${text}<span class="remove-term" data-param="${paramType}" data-value="${paramValue}" title="${t.removeFilter}">✕</span></span>`;
    } else {
      return text;
    }
  };
  
  // Main query
  if (mainQuery) {
    hasParameters = true;
    // Check if it's an exact phrase search
    if (mainQuery.startsWith('"') && mainQuery.endsWith('"') && mainQuery.length > 2) {
      const phrase = mainQuery.substring(1, mainQuery.length - 1);
      description += createTermWithRemoveButton(`"${phrase}" (${t.exactPhrase})`, 'mainQuery', mainQuery);
    } else {
      // Terms with AND
      const terms = mainQuery.split(/\s+/).filter(term => term.length > 0);
      if (terms.length > 1) {
        description += createTermWithRemoveButton(terms.join(` ${t.termAnd} `), 'mainQuery', mainQuery);
      } else {
        description += createTermWithRemoveButton(mainQuery, 'mainQuery', mainQuery);
      }
    }
  }
  
  // Add advanced options only if the advanced search is visible
  if (advancedSearchVisible) {
    // Advanced filters
    if (titleFilter) {
      description += `${hasParameters ? ', ' : ''}` + 
        createTermWithRemoveButton(`${titleFilter} ${t.inTitle}`, 'titleFilter', titleFilter);
      hasParameters = true;
    }
    
    if (authorFilter) {
      description += `${hasParameters ? ', ' : ''}` + 
        createTermWithRemoveButton(`${t.byAuthor} ${authorFilter}`, 'authorFilter', authorFilter);
      hasParameters = true;
    }
    
    if (typeFilter) {
      description += `${hasParameters ? ', ' : ''}` + 
        createTermWithRemoveButton(`${t.ofType} ${typeFilter}`, 'typeFilter', typeFilter);
      hasParameters = true;
    }
    
    if (startYearFilter) {
      description += `${hasParameters ? ', ' : ''}` + 
        createTermWithRemoveButton(`${t.fromYear} ${startYearFilter}`, 'startYearFilter', startYearFilter);
      hasParameters = true;
    }
    
    if (endYearFilter) {
      description += `${hasParameters ? ', ' : ''}` + 
        createTermWithRemoveButton(`${t.toYear} ${endYearFilter}`, 'endYearFilter', endYearFilter);
      hasParameters = true;
    }
    
    // Multi-term search
    if (term1) {
      description += hasParameters ? ', ' : '';
      hasParameters = true;
      description += createTermWithRemoveButton(term1, 'term1', term1);
      
      if (term2) {
        const opText = operator1 === 'AND' ? t.termAnd : t.termOr;
        description += ` ${opText} ` + createTermWithRemoveButton(term2, 'term2', term2);
        
        if (term3) {
          const opText2 = operator2 === 'AND' ? t.termAnd : t.termOr;
          description += ` ${opText2} ` + createTermWithRemoveButton(term3, 'term3', term3);
        }
      }
    }
  }
  
  if (!hasParameters) {
    description += t.allTypes; // Show "All Types" if no search parameters
  }
  
  // No need to add event listeners here anymore since we're using event delegation
  // Just return the description HTML
  return description;
}


// Check if all search parameters are empty
function isAllSearchEmpty() {
  const mainQuery = document.getElementById('searchBox').value.trim();
  const titleFilter = document.getElementById('titleFilter').value.trim();
  const authorFilter = document.getElementById('authorFilter').value.trim();
  const typeFilter = document.getElementById('typeFilter').value;
  const startYearFilter = document.getElementById('startYearFilter').value;
  const endYearFilter = document.getElementById('endYearFilter').value;
  const term1 = document.getElementById('searchTerm1').value.trim();
  const term2 = document.getElementById('searchTerm2').value.trim();
  const term3 = document.getElementById('searchTerm3').value.trim();
  
  return !mainQuery && !titleFilter && !authorFilter && !typeFilter && 
         !startYearFilter && !endYearFilter && !term1 && !term2 && !term3;
}

// Reset search and clear results
function resetSearch() {
  // Clear all inputs
  document.getElementById('searchBox').value = '';
  document.getElementById('titleFilter').value = '';
  document.getElementById('authorFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('startYearFilter').value = '';
  document.getElementById('endYearFilter').value = '';
  document.getElementById('searchTerm1').value = '';
  document.getElementById('searchTerm2').value = '';
  document.getElementById('searchTerm3').value = '';
  
  // Clear results
  filteredResults = [];
  resultsDiv.innerHTML = '';
  statsDiv.innerHTML = '';
  paginationDiv.innerHTML = '';
  
  // Hide results per page selectors
  document.querySelector('.results-header .results-per-page').style.display = 'none';
  document.querySelector('.results-footer').style.display = 'none';
  
  // Switch back to basic search if advanced search is visible
  const advancedSearch = document.getElementById('advancedSearch');
  if (!advancedSearch.classList.contains('hidden')) {
    toggleAdvancedSearch(); // This will hide advanced search and show basic search
  }
  
  // Reset the URL to remove all parameters
  const baseUrl = window.location.pathname;
  window.history.pushState({ path: baseUrl }, '', baseUrl);
  
  console.log('Search reset, URL cleared to:', window.location.href);
}