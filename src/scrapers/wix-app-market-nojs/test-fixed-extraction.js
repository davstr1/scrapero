const axios = require('axios');
const cheerio = require('cheerio');

async function testFixedExtraction() {
  const url = 'https://www.wix.com/app-market/web-solution/visitor-analytics';
  
  console.log('Testing fixed extraction...\n');
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  const pageText = $('body').text().replace(/\s+/g, ' ').trim();
  
  // Extract app name
  const titleMatch = pageText.match(/TWIPLA Website Intelligence/);
  const appName = titleMatch ? 'TWIPLA Website Intelligence' : '';
  console.log(`App Name: ${appName}`);
  
  // Extract rating - look for pattern near app name
  const appSection = pageText.substring(pageText.indexOf(appName), pageText.indexOf(appName) + 500);
  const ratingMatch = appSection.match(/(\d+\.?\d*)(\d+)\s*reviews?/);
  if (ratingMatch) {
    const rating = ratingMatch[1];
    const reviews = ratingMatch[1] + ratingMatch[2];
    console.log(`Rating: ${rating}`);
    console.log(`Reviews: ${reviews}`);
  }
  
  // Alternative approach - look for specific patterns
  const patterns = {
    rating: /(\d\.\d)(\d+)\s*reviews/,
    developer: /By\s+([^F]+)\s*Free/,
    price: /From\s*[€$]\s*(\d+(?:\.\d+)?)/,
    installs: /(\d+[,\d]*\+?)\s*(?:installs?|sites?)/i
  };
  
  console.log('\n--- Pattern Matching ---');
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = pageText.match(pattern);
    if (match) {
      console.log(`${key}: ${match[1]}`);
    }
  }
  
  // Extract description
  const descMatch = pageText.match(/See conversion blockers[^0-9]+/);
  if (descMatch) {
    console.log(`Description: ${descMatch[0].trim()}`);
  }
  
  // Look for pricing info
  console.log('\n--- Pricing Info ---');
  const priceMatches = pageText.matchAll(/€\s*(\d+(?:\.\d+)?)\s*\/month/g);
  const prices = [...priceMatches].map(m => m[1]);
  console.log(`Prices found: €${prices.join(', €')}/month`);
  
  // Check for free plan
  const hasFree = pageText.includes('Free plan available');
  console.log(`Has free plan: ${hasFree}`);
  
  // Extract features if available
  const featurePatterns = [
    /(\d+)\s*Page Visits/,
    /(\d+)\s*Visitor Recordings/,
    /(\d+)\s*Heatmaps?/
  ];
  
  console.log('\n--- Features ---');
  for (const pattern of featurePatterns) {
    const match = pageText.match(pattern);
    if (match) {
      console.log(`- ${match[0]}`);
    }
  }
}

testFixedExtraction();