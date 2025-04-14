/**
 * This script updates article data from data_en.js with more reliable information from titles_en.js
 * It replaces title, author, and type fields in data_en.js with corresponding values from titles_en.js
 * 
 * Usage: node updateArticleData.js [dataFilePath] [titlesFilePath]
 * 
 * If no file paths are provided, it defaults to 'data_en.js' and 'titles_en.js' in the current directory
 */

const fs = require('fs');

// Read the JSON files
const dataFile = process.argv[2] || 'data_en.js';
const titlesFile = process.argv[3] || 'titles_en.js';

// Function to extract JSON content from files that might not be pure JSON
function extractJSONFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try direct JSON parsing first
  try {
    return JSON.parse(content);
  } catch (e) {
    // If not valid JSON, try to extract JSON array pattern
    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    // If we can't find a JSON array, look for assignment or export
    const assignmentMatch = content.match(/(?:const|let|var|export)(?:\s+default)?\s+\w+\s*=\s*(\[\s*\{[\s\S]*\}\s*\])/);
    if (assignmentMatch) {
      return JSON.parse(assignmentMatch[1]);
    }
  }
  throw new Error(`Could not extract JSON from file: ${filePath}`);
}

console.log(`Reading data from ${dataFile}...`);
console.log(`Reading titles from ${titlesFile}...`);

// Extract the JSON data
let dataEntries, titlesEntries;
try {
  dataEntries = extractJSONFromFile(dataFile);
  titlesEntries = extractJSONFromFile(titlesFile);
} catch (error) {
  console.error(`Error extracting JSON: ${error.message}`);
  process.exit(1);
}

console.log(`Found ${dataEntries.length} data entries and ${titlesEntries.length} title entries.`);

// Create a lookup map for faster access to title entries
const titlesMap = {};
titlesEntries.forEach(titleEntry => {
  const key = `${titleEntry.issue}/${titleEntry["article-id"]}`;
  titlesMap[key] = titleEntry;
});

// Count how many entries we expect to match
let expectedMatches = 0;
dataEntries.forEach(dataEntry => {
  const pathParts = dataEntry.path.split('/');
  if (pathParts.length === 2) {
    expectedMatches++;
  }
});

console.log(`Expecting to match approximately ${expectedMatches} entries...`);

// Update the data entries with information from the titles
let matchCount = 0;
const updatedDataEntries = dataEntries.map(dataEntry => {
  // Extract issue and article-id from the path
  const pathParts = dataEntry.path.split('/');
  if (pathParts.length !== 2) {
    console.log(`Skipping entry with invalid path format: ${dataEntry.path}`);
    return dataEntry;
  }
  
  const issue = dataEntry.issue;
  const articleId = pathParts[1].replace('.txt', '');
  
  // Create the lookup key
  const lookupKey = `${issue}/${articleId}`;
  
  // Find the matching title entry
  const matchingTitleEntry = titlesMap[lookupKey];
  
  if (matchingTitleEntry) {
    matchCount++;
    
    // Create a new object with updated fields
    return {
      ...dataEntry,
      title: matchingTitleEntry["article-title"],
      author: matchingTitleEntry.author !== null ? matchingTitleEntry.author : "",
      type: matchingTitleEntry["article-type"]
    };
  } else {
    return dataEntry;
  }
});

console.log(`Successfully matched and updated ${matchCount} entries (${Math.round(matchCount/dataEntries.length*100)}% of data).`);

// Get the original file structure to maintain it
const originalContent = fs.readFileSync(dataFile, 'utf8');
const outputFile = 'updated_data_en.js';
let outputContent;

// Try to maintain the original file format
if (originalContent.trim().startsWith('export default')) {
  outputContent = `export default ${JSON.stringify(updatedDataEntries, null, 2)};`;
} else if (originalContent.trim().match(/^export\s+const\s+\w+/)) {
  const varNameMatch = originalContent.match(/^export\s+const\s+(\w+)/);
  const varName = varNameMatch ? varNameMatch[1] : 'data';
  outputContent = `export const ${varName} = ${JSON.stringify(updatedDataEntries, null, 2)};`;
} else if (originalContent.trim().match(/^(const|let|var)\s+\w+/)) {
  const varNameMatch = originalContent.match(/^(const|let|var)\s+(\w+)/);
  const varType = varNameMatch ? varNameMatch[1] : 'const';
  const varName = varNameMatch ? varNameMatch[2] : 'data';
  outputContent = `${varType} ${varName} = ${JSON.stringify(updatedDataEntries, null, 2)};\n\nmodule.exports = ${varName};`;
} else {
  // Just write the plain JSON
  outputContent = JSON.stringify(updatedDataEntries, null, 2);
}

try {
  fs.writeFileSync(outputFile, outputContent);
  console.log(`Updated data written to ${outputFile}`);
} catch (error) {
  console.error(`Error writing output file: ${error.message}`);
  process.exit(1);
}
