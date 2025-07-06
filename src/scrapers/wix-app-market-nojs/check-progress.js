const fs = require('fs').promises;

async function checkProgress() {
  try {
    // Check progress file
    const progressData = await fs.readFile('data/scrape-progress.json', 'utf8');
    const progress = JSON.parse(progressData);
    
    console.log('=== Scraping Progress ===');
    console.log(`Completed: ${progress.completedSlugs.length} / 1174 apps`);
    console.log(`Progress: ${(progress.completedSlugs.length / 1174 * 100).toFixed(1)}%`);
    
    // Check CSV
    const csvData = await fs.readFile('data/apps-full.csv', 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    console.log(`CSV Lines: ${lines.length - 1} entries`);
    
    // Sample first few lines to check categories
    console.log('\nSample entries with categories:');
    const headers = lines[0].split(',');
    const categoryIndex = headers.indexOf('Category');
    
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      const cols = lines[i].split(',');
      console.log(`- ${cols[1]} | Category: ${cols[categoryIndex]}`);
    }
    
  } catch (error) {
    console.error('Error reading progress:', error.message);
  }
}

checkProgress();