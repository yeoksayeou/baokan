// Global variables
const resultsDiv = document.getElementById('results');
const statsDiv = document.getElementById('stats');
const paginationDiv = document.getElementById('pagination');
let searchTimeout = null;
let currentPage = 1;
let resultsPerPage = 100; // Default to 100 results per page
let filteredResults = [];
let currentLanguage = 'en'; // Default language is English

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Don't call initializeFilters() here - it will be called after data is loaded
  
  // Setup search buttons
  document.getElementById('searchButton').addEventListener('click', performSearch);
  document.getElementById('advancedSearchButton').addEventListener('click', performSearch);

  const translationToggle = document.getElementById('translation-toggle');
  if (translationToggle) {
    // Set initial state (unchecked by default)
    translationToggle.checked = false;
    
    // Add change event to load appropriate data file and update search
    translationToggle.addEventListener('change', function() {
      // Load appropriate data file based on toggle state
      loadDataFile();
    });
    
    // Initial data load - this will call initializeFilters() after loading
    loadDataFile();
  }
  
  // Setup enter key in main search box
  document.getElementById('searchBox').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Setup enter key in advanced search fields
  document.getElementById('titleFilter').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  document.getElementById('authorFilter').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  document.getElementById('searchTerm1').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  document.getElementById('searchTerm2').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  document.getElementById('searchTerm3').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Setup results per page dropdowns (top and bottom synchronization)
  document.getElementById('resultsPerPage').addEventListener('change', function() {
    resultsPerPage = parseInt(this.value);
    // Keep bottom dropdown in sync
    document.getElementById('resultsPerPageBottom').value = this.value;
    if (filteredResults.length > 0) {
      currentPage = 1;
      displayResults();
    }
  });
  
  document.getElementById('resultsPerPageBottom').addEventListener('change', function() {
    resultsPerPage = parseInt(this.value);
    // Keep top dropdown in sync
    document.getElementById('resultsPerPage').value = this.value;
    if (filteredResults.length > 0) {
      currentPage = 1;
      displayResults();
    }
  });
  
  // Setup year validation
  document.getElementById('startYearFilter').addEventListener('change', validateYearRange);
  document.getElementById('endYearFilter').addEventListener('change', validateYearRange);
  
  // Hide the year error message by default
  document.getElementById('yearError').style.display = 'none';
  
  // Add a single global event listener for all remove-term buttons using event delegation
  document.body.addEventListener('click', function(e) {
    // Check if the clicked element is a remove-term button
    if (e.target.classList.contains('remove-term')) {
      console.log('Remove button clicked!', e.target);
      const paramType = e.target.getAttribute('data-param');
      
      console.log('Clearing parameter:', paramType);
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
      console.log('All empty?', allEmpty);
      
      if (allEmpty) {
        console.log('All search fields are empty - resetting search');
        // Reset search which will clear the URL completely
        resetSearch();
      } else {
        console.log('Some search fields still have values - re-running search');
        // Re-run search with updated parameters
        performSearch();
      }
    }
  });
  
  // Parse URL parameters if any
  parseUrlParams();
});