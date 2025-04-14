const fs = require('fs');
const path = require('path');

// Path to your input data.js file
const inputFile = 'data.js';
// Path for the output minified JSON
const outputFile = 'data.min.json';

// Read the original data.js file
fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err.message}`);
    return;
  }

  try {
    // Create a temporary file that we can safely require
    const tempFile = path.join(__dirname, 'temp_data.js');
    
    // Modify the content to export the array instead of assigning to window
    const modifiedContent = data.replace('window.ARTICLES =', 'module.exports =');
    
    // Write the modified content to the temporary file
    fs.writeFileSync(tempFile, modifiedContent, 'utf8');
    
    // Now we can safely require the file
    const articlesArray = require(tempFile);
    
    // Convert to minified JSON (no whitespace)
    const minifiedJson = JSON.stringify(articlesArray);
    
    // Write to the output file
    fs.writeFile(outputFile, minifiedJson, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(`Error writing file: ${writeErr.message}`);
        return;
      }
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      // Calculate size reduction
      const originalSize = data.length;
      const newSize = minifiedJson.length;
      const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);
      
      console.log(`Conversion complete!`);
      console.log(`Original size: ${formatBytes(originalSize)}`);
      console.log(`Minified JSON size: ${formatBytes(newSize)}`);
      console.log(`Size reduction: ${reduction}%`);
    });
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
  }
});

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
