// Quick test script to verify the scraper works
const { exec } = require('child_process');

console.log('Testing scraper CLI...\n');

// Test listing scrapers
exec('npm run scraper list', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log('Available scrapers:');
  console.log(stdout);
});

// Test validating the books-to-scrape config
exec('npm run scraper validate books-to-scrape', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log('Validation result:');
  console.log(stdout);
});