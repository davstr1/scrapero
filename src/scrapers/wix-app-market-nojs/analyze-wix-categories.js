const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('/tmp/wix-groups-raw.html', 'utf8');

// Look for the main app content area
const appDetailStart = html.indexOf('data-selected="wix-groups"');
console.log('Found app detail marker at:', appDetailStart);

// Search for breadcrumb patterns
const breadcrumbPatterns = [
  /breadcrumb/gi,
  /category.*?communication/gi,
  /communication.*?community/gi,
  /<a[^>]*href[^>]*category[^>]*>/gi
];

console.log('\nSearching for breadcrumb/category patterns...\n');

breadcrumbPatterns.forEach((pattern, i) => {
  const matches = html.match(pattern);
  if (matches) {
    console.log(`Pattern ${i + 1}: Found ${matches.length} matches`);
    matches.slice(0, 3).forEach(match => {
      console.log(`  - ${match}`);
    });
  }
});

// Look for category links in the app detail area
const categoryLinkPattern = /<a[^>]*href[^>]*\/category\/[^>]*>([^<]+)<\/a>/gi;
const categoryLinks = html.match(categoryLinkPattern);
if (categoryLinks) {
  console.log('\n\nFound category links:');
  categoryLinks.forEach(link => {
    const categoryName = link.match(/>([^<]+)</);
    if (categoryName) {
      console.log(`  - ${categoryName[1]}`);
    }
  });
}

// Search around the app detail content
const searchNearApp = (term) => {
  const index = html.indexOf(term);
  if (index > -1) {
    // Look for category indicators nearby
    const nearbyContent = html.substring(Math.max(0, index - 500), Math.min(html.length, index + 500));
    const categoryMatches = nearbyContent.match(/category[^>]*>([^<]+)</gi);
    if (categoryMatches) {
      return categoryMatches;
    }
  }
  return null;
};

console.log('\n\nSearching near app-specific content...');
const nearAppMatches = searchNearApp('Host and manage monetizable online communities');
if (nearAppMatches) {
  console.log('Found near app description:', nearAppMatches);
}

// Look for JSON data that might contain categories
const jsonPattern = /"categories":\s*\[[^\]]+\]/gi;
const jsonMatches = html.match(jsonPattern);
if (jsonMatches) {
  console.log('\n\nFound JSON category data:');
  jsonMatches.forEach(match => {
    console.log(match);
  });
}