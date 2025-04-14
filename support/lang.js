// Update the translations object in lang.js to include the toggle label
const translations = {
  en: {
    searchPlaceholder: "Enter search term...",
    searchButton: "Search",
    advancedOptions: "Advanced Search Options",
    titleLabel: "Title:",
    titlePlaceholder: "Search in titles...",
    authorLabel: "Author:",
    authorPlaceholder: "Author name...",
    typeLabel: "Article Type:",
    allTypes: "All Types",
    yearRangeLabel: "Year Range:",
    fromYearPlaceholder: "From year",
    toLabel: "to",
    toYearPlaceholder: "To year",
    yearError: "End year must be greater than or equal to start year",
    multiTermLabel: "Multi-term Search:",
    firstTermPlaceholder: "First term",
    secondTermPlaceholder: "Second term",
    thirdTermPlaceholder: "Third term (optional)",
    resultsPerPage: "Results per page:",
    noResults: "No search results found.",
    loading: "Searching...",
    resultsStats: "Results:",
    matchesIn: "matches in",
    matchesFound: "matches",
    documentsFound: "documents found",
    documents: "documents",
    docs: "docs",
    matchesByYear: "Matches by year:",
    matchesInDocs: "matches in",
    totalMatches: "matches found in this document",
    previous: "Previous",
    next: "Next",
    issueLabel: "Issue:",
    dateLabel: "Date:",
    authorResultLabel: "Author:",
    typeResultLabel: "Type:",
    searchCriteriaAlert: "Please enter at least one search term or filter",
    searchingFor: "Searching for:",
    inTitle: "in title",
    byAuthor: "by author",
    ofType: "of type",
    fromYear: "from year",
    toYear: "to year",
    termAnd: "AND",
    termOr: "OR",
    exactPhrase: "exact phrase",
    advancedSearchOn: "[Advanced Search On]",
    tableOfContents: "Table of Contents",
    removeFilter: "Remove this filter",
    scrollToTop: "Back to top",
    filterByYear: "Filter results to this year only",
    englishTranslations: "English Translations" // New entry for the toggle label
  },
  ko: {
    searchPlaceholder: "검색어 입력...",
    searchButton: "검색",
    advancedOptions: "고급 검색 옵션",
    titleLabel: "제목:",
    titlePlaceholder: "제목에서 검색...",
    authorLabel: "저자:",
    authorPlaceholder: "저자 이름...",
    typeLabel: "기사 유형:",
    allTypes: "모든 유형",
    yearRangeLabel: "연도 범위:",
    fromYearPlaceholder: "시작 연도",
    toLabel: "부터",
    toYearPlaceholder: "종료 연도",
    yearError: "종료 연도는 시작 연도보다 크거나 같아야 합니다",
    multiTermLabel: "다중 용어 검색:",
    firstTermPlaceholder: "첫 번째 용어",
    secondTermPlaceholder: "두 번째 용어",
    thirdTermPlaceholder: "세 번째 용어 (선택사항)",
    resultsPerPage: "페이지당 결과:",
    noResults: "검색 결과가 없습니다.",
    loading: "검색 중...",
    resultsStats: "결과:",
    matchesIn: "개의 일치 항목이",
    matchesFound: "개의 일치 항목",
    documentsFound: "개의 문서를 찾았습니다",
    documents: "개의 문서에서 발견됨",
    docs: "개의 문서",
    matchesByYear: "연도별 일치 항목:",
    matchesInDocs: "개의 일치 항목이",
    totalMatches: "개의 일치 항목이 이 문서에서 발견됨",
    previous: "이전",
    next: "다음",
    issueLabel: "호수:",
    dateLabel: "발행일:",
    authorResultLabel: "필자:",
    typeResultLabel: "형태:",
    searchCriteriaAlert: "검색어나 필터를 하나 이상 입력하세요",
    searchingFor: "검색 중:",
    inTitle: "제목에서",
    byAuthor: "저자",
    ofType: "유형",
    fromYear: "시작 연도",
    toYear: "종료 연도",
    termAnd: "그리고",
    termOr: "또는",
    exactPhrase: "정확한 구문",
    advancedSearchOn: "[고급 검색 활성화]",
    tableOfContents: "목차",
    removeFilter: "이 필터 제거",
    scrollToTop: "맨 위로",
    filterByYear: "이 연도로만 결과 필터링하기",
    englishTranslations: "영어 번역" // New entry for the toggle label
  }
};

// Function to set language for the interface
function setLanguage(lang) {
  currentLanguage = lang;
  document.getElementById('langEn').classList.toggle('active', lang === 'en');
  document.getElementById('langKo').classList.toggle('active', lang === 'ko');
  
  const t = translations[currentLanguage];
  
  // Update placeholders and text
  document.getElementById('searchBox').placeholder = t.searchPlaceholder;
  document.querySelectorAll('.search-button').forEach(button => {
    button.textContent = t.searchButton;
  });
  
  // Update Table of Contents link
  document.getElementById('tocLink').textContent = t.tableOfContents;
  
  const advancedToggle = document.querySelector('.advanced-search-toggle');
  const isAdvancedVisible = !document.getElementById('advancedSearch').classList.contains('hidden');
  advancedToggle.textContent = t.advancedOptions + (isAdvancedVisible ? ' ▲' : ' ▼');
  
  document.getElementById('titleFilterLabel').textContent = t.titleLabel;
  document.getElementById('titleFilter').placeholder = t.titlePlaceholder;
  document.getElementById('authorFilterLabel').textContent = t.authorLabel;
  document.getElementById('authorFilter').placeholder = t.authorPlaceholder;
  document.getElementById('typeFilterLabel').textContent = t.typeLabel;
  document.getElementById('yearRangeLabel').textContent = t.yearRangeLabel;
  document.getElementById('startYearFilter').placeholder = t.fromYearPlaceholder;
  document.getElementById('toLabel').textContent = t.toLabel;
  document.getElementById('endYearFilter').placeholder = t.toYearPlaceholder;
  document.getElementById('yearError').textContent = t.yearError;
  document.getElementById('multiTermLabel').textContent = t.multiTermLabel;
  document.getElementById('searchTerm1').placeholder = t.firstTermPlaceholder;
  document.getElementById('searchTerm2').placeholder = t.secondTermPlaceholder;
  document.getElementById('searchTerm3').placeholder = t.thirdTermPlaceholder;
  document.getElementById('resultsPerPageLabel').textContent = t.resultsPerPage;
  document.getElementById('resultsPerPageLabelBottom').textContent = t.resultsPerPage;
  
  // Update the toggle label
  const toggleLabel = document.querySelector('.toggle-label');
  if (toggleLabel) {
    toggleLabel.textContent = t.englishTranslations;
  }
  
  // Update type filter options
  const typeFilter = document.getElementById('typeFilter');
  const firstOption = typeFilter.options[0];
  firstOption.textContent = t.allTypes;
  
  // If results are already displayed, update them
  if (filteredResults.length > 0) {
    displayResults();
  }
}