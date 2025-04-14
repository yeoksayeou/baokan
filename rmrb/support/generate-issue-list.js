const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 1. Load data.js and evaluate it
const inputFile = 'data.js';
const inputCode = fs.readFileSync(inputFile, 'utf-8');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(inputCode, context);

const articles = context.window.ARTICLES;
if (!Array.isArray(articles)) {
    console.error('ARTICLES not found or invalid.');
    process.exit(1);
}

// 2. Extract unique issue names and sort
const issueSet = new Set();
for (const article of articles) {
    if (article.issue) {
        issueSet.add(article.issue);
    }
}

const sortedIssues = Array.from(issueSet).sort();

// 3. Write to issue-list.js
const outputPath = path.join(__dirname, 'output', 'issue-list.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const outputCode = `window.ISSUE_LIST = ${JSON.stringify(sortedIssues)};`;
fs.writeFileSync(outputPath, outputCode);

console.log(`✅ Wrote ${sortedIssues.length} issues to ${outputPath}`);
