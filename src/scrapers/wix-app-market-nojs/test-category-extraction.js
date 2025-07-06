const fs = require('fs');
const HttpClient = require('./lib/http-client');

async function analyzeCategories() {
  const httpClient = new HttpClient();
  
  console.log('Fetching Wix Groups page...');
  const response = await httpClient.get('https://www.wix.com/app-market/web-solution/wix-groups');
  const html = response.data;
  
  // Save HTML for analysis
  fs.writeFileSync('/tmp/wix-groups-raw.html', html);
  console.log('HTML saved to /tmp/wix-groups-raw.html');
  console.log('HTML length:', html.length);
  
  // Search for category patterns
  const patterns = ['Communication', 'Community', 'category', 'categories'];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'gi');
    const matches = html.match(regex);
    if (matches) {
      console.log(`\nFound "${pattern}": ${matches.length} occurrences`);
      
      // Find first occurrence and show context
      const index = html.toLowerCase().indexOf(pattern.toLowerCase());
      if (index > -1) {
        const start = Math.max(0, index - 150);
        const end = Math.min(html.length, index + 150);
        console.log('First occurrence context:');
        console.log(html.substring(start, end).replace(/\s+/g, ' '));
      }
    }
  }
  
  // Look for specific patterns in app detail sections
  console.log('\n\nSearching for app detail patterns...');
  
  // Common patterns for categories in app marketplaces
  const categoryPatterns = [
    /<span[^>]*>Communication<\/span>/gi,
    /<a[^>]*>Communication<\/a>/gi,
    /data-category="[^"]+"/gi,
    /category":\s*"[^"]+"/gi,
    /"categories":\s*\[[^\]]+\]/gi
  ];
  
  categoryPatterns.forEach((pattern, i) => {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`\nPattern ${i + 1} matches:`, matches.slice(0, 3));
    }
  });
}

analyzeCategories().catch(console.error);