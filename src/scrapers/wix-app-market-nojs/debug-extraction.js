const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function debugExtraction() {
  const url = 'https://www.wix.com/app-market/web-solution/visitor-analytics';
  
  console.log(`Fetching ${url}...`);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  console.log('\n=== DEBUGGING EXTRACTION ===\n');
  
  // Save HTML for inspection
  await fs.writeFile('debug-page.html', response.data);
  console.log('HTML saved to debug-page.html');
  
  // Look for rating patterns
  console.log('\n--- Rating Search ---');
  const ratingPatterns = [
    /(\d+\.?\d*)\s*out of 5/i,
    /(\d+\.?\d*)\s*\/\s*5/,
    /rating[:\s]+(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*stars?/i
  ];
  
  const bodyText = $('body').text();
  
  // Search for rating patterns in smaller chunks
  const textChunks = bodyText.split('\n').filter(line => line.trim());
  
  for (const chunk of textChunks) {
    for (const pattern of ratingPatterns) {
      const match = chunk.match(pattern);
      if (match) {
        console.log(`Found match: "${chunk.trim()}"`);
        console.log(`Pattern: ${pattern}`);
        console.log(`Extracted: ${match[1]}`);
      }
    }
  }
  
  // Look for specific rating elements
  console.log('\n--- Element Search ---');
  
  // Search for elements containing "out of 5"
  $('*:contains("out of 5")').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length < 100) {
      console.log(`Element with "out of 5": "${text}"`);
    }
  });
  
  // Look for install patterns
  console.log('\n--- Install Search ---');
  const installPatterns = [
    /(\d+[,\d]*\+?)\s*(?:active\s*)?install(?:s|ations)?/i,
    /installed\s*on\s*(\d+[,\d]*\+?)/i,
    /(\d+[,\d]*\+?)\s*sites?\s*use/i,
    /used\s*by\s*(\d+[,\d]*\+?)/i
  ];
  
  for (const chunk of textChunks) {
    for (const pattern of installPatterns) {
      const match = chunk.match(pattern);
      if (match) {
        console.log(`Found install match: "${chunk.trim()}"`);
        console.log(`Extracted: ${match[1]}`);
      }
    }
  }
  
  // Look for any numbers near "rating" or "review" words
  console.log('\n--- Context Search ---');
  const contextPatterns = ['rating', 'review', 'star', 'install', 'user', 'site'];
  
  for (const contextWord of contextPatterns) {
    const elements = $(`*:contains("${contextWord}")`).filter((i, el) => {
      const text = $(el).text();
      return text.length < 200 && text.match(/\d/);
    });
    
    if (elements.length > 0) {
      console.log(`\nElements containing "${contextWord}":`);
      elements.slice(0, 3).each((i, el) => {
        console.log(`- "${$(el).text().trim()}"`);
      });
    }
  }
}

debugExtraction().catch(console.error);