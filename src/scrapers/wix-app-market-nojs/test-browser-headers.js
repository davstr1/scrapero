const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function testWithBrowserHeaders() {
  const url = 'https://www.wix.com/app-market/web-solution/visitor-analytics';
  
  console.log('Testing with different User-Agent headers...\n');
  
  const userAgents = [
    {
      name: 'Chrome Browser',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    {
      name: 'Firefox Browser', 
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    },
    {
      name: 'Safari Browser',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    },
    {
      name: 'Googlebot',
      ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  ];
  
  for (const agent of userAgents) {
    console.log(`\nTesting with ${agent.name}:`);
    console.log(`UA: ${agent.ua}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': agent.ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      const $ = cheerio.load(response.data);
      const filename = `test-${agent.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      await fs.writeFile(filename, response.data);
      
      // Look for actual content
      console.log(`Status: ${response.status}`);
      console.log(`HTML length: ${response.data.length}`);
      
      // Search for TWIPLA content in various ways
      const searchTerms = ['TWIPLA', '4.6', 'rating', 'installs', 'reviews'];
      
      for (const term of searchTerms) {
        const matches = response.data.split(term).length - 1;
        if (matches > 0) {
          console.log(`Found "${term}": ${matches} times`);
        }
      }
      
      // Look for specific patterns
      const patterns = [
        { name: 'Rating pattern', regex: /(\d+\.?\d*)\s*(out of 5|\/5|stars)/gi },
        { name: 'Install pattern', regex: /(\d+[,\d]*\+?)\s*(installs?|installations?)/gi },
        { name: 'Review pattern', regex: /(\d+[,\d]*)\s*(reviews?|ratings?)/gi }
      ];
      
      for (const pattern of patterns) {
        const matches = [...response.data.matchAll(pattern.regex)];
        if (matches.length > 0) {
          console.log(`${pattern.name}: ${matches.map(m => m[0]).join(', ')}`);
        }
      }
      
      // Check page structure
      console.log(`Has <noscript>: ${response.data.includes('<noscript')}`);
      console.log(`Has React root: ${response.data.includes('id="root"')}`);
      console.log(`Has __NEXT_DATA__: ${response.data.includes('__NEXT_DATA__')}`);
      
      // Try to find rating in page text
      const pageText = $('body').text();
      const cleanText = pageText.replace(/\s+/g, ' ').trim();
      
      // Look for rating near TWIPLA
      const twipla = cleanText.indexOf('TWIPLA');
      if (twipla > -1) {
        const nearbyText = cleanText.substring(Math.max(0, twipla - 100), twipla + 200);
        console.log(`Text near TWIPLA: ${nearbyText}`);
      }
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testWithBrowserHeaders();