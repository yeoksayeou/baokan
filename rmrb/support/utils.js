// Function to get URL parameters
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Load appropriate data file based on translation toggle
function loadDataFile() {
  // Remove any existing data script
  const existingScript = document.getElementById('data-script');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Clear the existing ARTICLES from global scope to prevent redeclaration error
  if (typeof ARTICLES !== 'undefined') {
    window.ARTICLES = undefined;
  }
  
  // Check if translations toggle is on
  const useTranslations = document.getElementById('translation-toggle').checked;
  
  // Check if we're running locally (file://) or on a web server (http:// or https://)
  const isLocalFile = window.location.protocol === 'file:';
  
  // If running locally, use direct script loading to avoid CORS issues
  if (isLocalFile) {
    console.log("Detected local file system. Using direct script loading method.");
    loadScriptDirectly(useTranslations);
  } else {
    // For web servers, use the gzip approach
    console.log("Detected web server. Using gzip decompression method.");
    loadCompressedData(useTranslations);
  }
}

// Function to load script directly (for local file:// usage)
function loadScriptDirectly(useTranslations) {
  const dataFilePath = useTranslations ? 'data/data_en.js' : 'data/data.js';
  console.log(`Loading uncompressed data from: ${dataFilePath}`);
  
  const script = document.createElement('script');
  script.id = 'data-script';
  script.src = dataFilePath;
  
  // Handle load event
  script.onload = function() {
    console.log(`Loaded ${dataFilePath}`);
    
    // Now that we have the data, initialize filters
    initializeFilters();
    
    // If search is active, re-run it with new data
    if (document.querySelector('.results-header .results-per-page').style.display === 'block') {
      performSearch();
    }
  };
  
  // Handle error
  script.onerror = function() {
    console.error(`Failed to load ${dataFilePath}`);
    alert(`Error loading data file: ${dataFilePath}. Please refresh the page.`);
  };
  
  // Add script to document
  document.body.appendChild(script);
}

// Function to load and decompress gzipped data (for http/https usage)
function loadCompressedData(useTranslations) {
  // Set source based on toggle state
  const dataFilePath = useTranslations ? 'data/data_en.js.gz' : 'data/data.js.gz';
  
  console.log(`Loading compressed data from: ${dataFilePath}`);
  
  // Show loading indicator (optional)
  // statsDiv.innerHTML = `<div class="loading">${translations[currentLanguage].loading}</div>`;
  
  // Fetch the gzipped file
  fetch(dataFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataFilePath}: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then(compressedData => {
      // Decompress the gzipped data
      return new Promise((resolve, reject) => {
        try {
          // Use DecompressionStream API (modern browsers)
          const ds = new DecompressionStream('gzip');
          const decompressedStream = new Blob([compressedData])
            .stream()
            .pipeThrough(ds);
          
          new Response(decompressedStream).text().then(text => {
            resolve(text);
          }).catch(err => {
            reject(err);
          });
        } catch (err) {
          reject(new Error(`Decompression failed: ${err.message}`));
        }
      });
    })
    .then(jsCode => {
      // Execute the data.js code to define ARTICLES
      try {
        // Create a temporary script element to execute the code
        const script = document.createElement('script');
        script.id = 'data-script';
        script.textContent = jsCode;
        document.body.appendChild(script);
        
        console.log(`Successfully loaded and executed ${dataFilePath}`);
        
        // Now that we have the data, initialize filters
        initializeFilters();
        
        // If search is active, re-run it with new data
        if (document.querySelector('.results-header .results-per-page').style.display === 'block') {
          performSearch();
        }
      } catch (err) {
        console.error(`Error executing decompressed JavaScript: ${err.message}`);
        alert(`Error loading data file: ${dataFilePath}. Please refresh the page.`);
      }
    })
    .catch(err => {
      console.error(`Error loading compressed data: ${err.message}`);
      
      // Fallback to uncompressed version if compressed version fails
      console.log(`Falling back to uncompressed data file`);
      loadScriptDirectly(useTranslations);
    });
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

// Escape special characters in a string for use in a regex pattern
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Toggle advanced search options
function toggleAdvancedSearch() {
  const advancedSearch = document.getElementById('advancedSearch');
  const searchBox = document.getElementById('searchBox');
  const searchButton = document.getElementById('searchButton');
  const advancedActive = !advancedSearch.classList.contains('hidden');
  
  // Toggle the visibility
  advancedSearch.classList.toggle('hidden');
  
  const toggle = document.querySelector('.advanced-search-toggle');
  const t = translations[currentLanguage];
  
  if (advancedSearch.classList.contains('hidden')) {
    // Advanced search is now hidden - show the main search box
    toggle.textContent = t.advancedOptions + ' ▼';
    
    // Remove any advanced indicator
    let indicator = toggle.querySelector('.advanced-active-indicator');
    if (indicator) {
      toggle.removeChild(indicator);
    }
    
    // Show search button and box
    searchBox.style.display = 'inline-block';
    searchButton.style.display = 'inline-block';
  } else {
    // Advanced search is now visible - hide the main search box
    toggle.textContent = t.advancedOptions + ' ▲';
    
    // Add advanced indicator
    const indicator = document.createElement('span');
    indicator.className = 'advanced-active-indicator';
    indicator.textContent = ' ' + t.advancedSearchOn;
    toggle.appendChild(indicator);
    
    // Copy search term from main search to first term in multi-search
    if (searchBox.value.trim() !== '') {
      document.getElementById('searchTerm1').value = searchBox.value.trim();
      searchBox.value = ''; // Clear the main search box
    }
    
    // Hide search button and box
    searchBox.style.display = 'none';
    searchButton.style.display = 'none';
  }
}

// Validate year range
function validateYearRange() {
  const startYear = document.getElementById('startYearFilter').value;
  const endYear = document.getElementById('endYearFilter').value;
  const errorElement = document.getElementById('yearError');
  
  if (startYear && endYear && parseInt(startYear) > parseInt(endYear)) {
    errorElement.style.display = 'block';
    return false;
  } else {
    errorElement.style.display = 'none';
    return true;
  }
}

// Initialize filter dropdowns
function initializeFilters() {
  const types = new Set();
  
  // Make sure ARTICLES is defined before trying to access it
  if (typeof ARTICLES === 'undefined' || !ARTICLES) {
    console.error('ARTICLES not defined when initializing filters');
    return;
  }
  
  // Get min and max years for the year range inputs
  let minYear = 3000;
  let maxYear = 1000;
  
  ARTICLES.forEach(article => {
    if (article.type) types.add(article.type);
    
    // Extract year from date
    if (article.date) {
      const match = article.date.match(/(\d{4})/);
      if (match) {
        const year = parseInt(match[1]);
        if (year < minYear) minYear = year;
        if (year > maxYear) maxYear = year;
      }
    }
  });
  
  // Set min/max attributes for year inputs
  document.getElementById('startYearFilter').min = minYear;
  document.getElementById('startYearFilter').max = maxYear;
  document.getElementById('endYearFilter').min = minYear;
  document.getElementById('endYearFilter').max = maxYear;
  
  // Populate only the type filter dropdown
  populateSelect('typeFilter', [...types].sort());
}

// Populate select dropdowns
function populateSelect(id, options) {
  const select = document.getElementById(id);
  
  // Clear existing options (except the first one which is "All Types")
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Add new options
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    select.appendChild(optionElement);
  });
}

// Parse URL parameters and set form fields
function parseUrlParams() {
  const queryString = window.location.search;
  if (!queryString) return;
  
  const urlParams = new URLSearchParams(queryString);
  
  // Set translation toggle if lang parameter is present
  const translationToggle = document.getElementById('translation-toggle');
  if (translationToggle && urlParams.has('lang') && urlParams.get('lang') === 'en') {
    translationToggle.checked = true;
    // Make sure the correct data file is loaded
    loadDataFile();
  }

  if (urlParams.has('q')) {
    document.getElementById('searchBox').value = urlParams.get('q');
  }
  
  // Check if advanced search should be active
  const hasAdvancedParams = urlParams.has('adv') || 
                           urlParams.has('title') || 
                           urlParams.has('author') || 
                           urlParams.has('type') || 
                           urlParams.has('startYear') || 
                           urlParams.has('endYear') || 
                           urlParams.has('term1') || 
                           urlParams.has('term2') || 
                           urlParams.has('term3');
  
  if (hasAdvancedParams) {
    // Show advanced search section
    const advancedSearch = document.getElementById('advancedSearch');
    const searchButton = document.getElementById('searchButton');
    const searchBox = document.getElementById('searchBox');
    advancedSearch.classList.remove('hidden');
    
    const toggle = document.querySelector('.advanced-search-toggle');
    const t = translations[currentLanguage];
    toggle.textContent = t.advancedOptions + ' ▲';
    
    // Add advanced indicator
    const indicator = document.createElement('span');
    indicator.className = 'advanced-active-indicator';
    indicator.textContent = ' ' + t.advancedSearchOn;
    toggle.appendChild(indicator);
    
    // Hide main search box and button
    searchBox.style.display = 'none';
    searchButton.style.display = 'none';
    
    // Set advanced filters
    if (urlParams.has('title')) {
      document.getElementById('titleFilter').value = urlParams.get('title');
    }
    
    if (urlParams.has('author')) {
      document.getElementById('authorFilter').value = urlParams.get('author');
    }
    
    if (urlParams.has('type')) {
      document.getElementById('typeFilter').value = urlParams.get('type');
    }
    
    if (urlParams.has('startYear')) {
      document.getElementById('startYearFilter').value = urlParams.get('startYear');
    }
    
    if (urlParams.has('endYear')) {
      document.getElementById('endYearFilter').value = urlParams.get('endYear');
    }
    
    // Set multi-term search
    if (urlParams.has('term1')) {
      document.getElementById('searchTerm1').value = urlParams.get('term1');
    }
    
    if (urlParams.has('op1')) {
      document.getElementById('operator').value = urlParams.get('op1').toUpperCase();
    }
    
    if (urlParams.has('term2')) {
      document.getElementById('searchTerm2').value = urlParams.get('term2');
    }
    
    if (urlParams.has('op2')) {
      document.getElementById('operator2').value = urlParams.get('op2').toUpperCase();
    }
    
    if (urlParams.has('term3')) {
      document.getElementById('searchTerm3').value = urlParams.get('term3');
    }
  }
  
  // Set results per page
  if (urlParams.has('rpp')) {
    const rpp = parseInt(urlParams.get('rpp'));
    if ([100, 200, 400].includes(rpp)) {
      resultsPerPage = rpp;
      document.getElementById('resultsPerPage').value = rpp.toString();
    }
  }
  
  // Set language
  if (urlParams.has('lang')) {
    const lang = urlParams.get('lang');
    if (['en', 'ko'].includes(lang)) {
      setLanguage(lang);
    }
  }
  
  // Perform search if any search params are present
  if (queryString.length > 1) {
    performSearch();
  }
}

// Update URL with current search parameters
function updateURL() {
  const params = new URLSearchParams();
  
  // Add language
  params.set('lang', currentLanguage);
  
  // Check if advanced search is visible
  const advancedSearchVisible = !document.getElementById('advancedSearch').classList.contains('hidden');
  
  // Add main search query only if advanced search is not visible
  if (!advancedSearchVisible) {
    const mainQuery = document.getElementById('searchBox').value.trim();
    if (mainQuery) {
      params.set('q', mainQuery);
    }
  }
  
  // Only add advanced parameters if advanced search is visible
  if (advancedSearchVisible) {
    // Add advanced filters
    const titleFilter = document.getElementById('titleFilter').value.trim();
    if (titleFilter) {
      params.set('title', titleFilter);
    }
    
    const authorFilter = document.getElementById('authorFilter').value.trim();
    if (authorFilter) {
      params.set('author', authorFilter);
    }
    
    const typeFilter = document.getElementById('typeFilter').value;
    if (typeFilter) {
      params.set('type', typeFilter);
    }
    
    const startYearFilter = document.getElementById('startYearFilter').value;
    if (startYearFilter) {
      params.set('startYear', startYearFilter);
    }
    
    const endYearFilter = document.getElementById('endYearFilter').value;
    if (endYearFilter) {
      params.set('endYear', endYearFilter);
    }
    
    // Add multi-term search parameters
    const term1 = document.getElementById('searchTerm1').value.trim();
    if (term1) {
      params.set('term1', term1);
    }
    
    const operator1 = document.getElementById('operator').value;
    const term2 = document.getElementById('searchTerm2').value.trim();
    if (term2) {
      params.set('op1', operator1);
      params.set('term2', term2);
    }
    
    const operator2 = document.getElementById('operator2').value;
    const term3 = document.getElementById('searchTerm3').value.trim();
    if (term3) {
      params.set('op2', operator2);
      params.set('term3', term3);
    }
  }
  
  // Add results per page
  params.set('rpp', resultsPerPage.toString());
  
  // Add parameter to indicate advanced search is active
  if (advancedSearchVisible) {
    params.set('adv', '1');
  }
  
  // Update URL without reloading the page
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.pushState({ path: newUrl }, '', newUrl);
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

function shouldIncludeTranslations() {
  const toggle = document.getElementById('translation-toggle');
  return toggle && toggle.checked;
}

// Function to create URLs that conditionally preserve the language parameter
function createUrl(base, params = {}) {
  const url = new URL(base, window.location.href);
  
  // Only add the language parameter if the translation toggle is checked
  if (shouldIncludeTranslations()) {
    url.searchParams.set('lang', 'en');
  }
  
  // Add all other parameters
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  return url.toString();
}

// Check if English language mode is active
function isEnglishMode() {
  // For the current page
  return getUrlParam('lang') === 'en';
}
