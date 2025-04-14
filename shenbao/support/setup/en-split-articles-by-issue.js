const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Read the large data.js file
const inputFile = 'data_en.js'; // or full path
const inputCode = fs.readFileSync(inputFile, 'utf-8');

// 2. Evaluate the file safely to extract window.ARTICLES
const context = { window: {} };
vm.createContext(context);
vm.runInContext(inputCode, context);

const articles = context.window.ARTICLES;
if (!Array.isArray(articles)) {
    console.error('ARTICLES not found or invalid.');
    process.exit(1);
}

// 3. Group articles by issue
const issuesMap = {};
for (const article of articles) {
    const issue = article.issue || 'Unknown';
    if (!issuesMap[issue]) {
        issuesMap[issue] = [];
    }

    // Strip empty/null/undefined fields
    const cleaned = {};
    for (const [key, value] of Object.entries(article)) {
        if (
            value !== '' &&
            value !== null &&
            value !== undefined &&
            !(Array.isArray(value) && value.length === 0)
        ) {
            cleaned[key] = value;
        }
    }

    issuesMap[issue].push(cleaned);
}

// 4. Write per-issue JS files using raw issue names
const outputDir = path.join(__dirname, 'output', 'issues');
fs.mkdirSync(outputDir, { recursive: true });

for (const [issue, issueArticles] of Object.entries(issuesMap)) {
    const safeFileName = issue + '.js'; // use raw issue name directly
    const filePath = path.join(outputDir, safeFileName);
    const json = JSON.stringify(issueArticles);
    const wrapped = `window.ISSUE_DATA=${json};`;
    fs.writeFileSync(filePath, wrapped);
}

console.log(`✅ Split complete: ${Object.keys(issuesMap).length} issue files written to ${outputDir}`);
