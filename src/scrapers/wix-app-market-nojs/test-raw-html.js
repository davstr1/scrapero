const axios = require('axios');
const fs = require('fs').promises;

async function testRawHtml() {
  try {
    // Test different URLs
    const urls = [
      'https://www.wix.com/app-market/web-solution/visitor-analytics',
      'https://www.wix.com/app-market/category/marketing',
      'https://www.wix.com/app-market'
    ];
    
    for (const url of urls) {
      console.log(`\nFetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      const html = response.data;
      const filename = url.split('/').pop() || 'homepage';
      await fs.writeFile(`raw-${filename}.html`, html);
      
      // Check for key patterns
      console.log(`Status: ${response.status}`);
      console.log(`Content length: ${html.length}`);
      console.log(`Contains <script>: ${html.includes('<script')}`);
      console.log(`Contains rating: ${html.includes('rating')}`);
      console.log(`Contains "out of 5": ${html.includes('out of 5')}`);
      console.log(`Contains install: ${html.includes('install')}`);
      console.log(`Contains TWIPLA: ${html.includes('TWIPLA')}`);
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
      if (titleMatch) {
        console.log(`Title: ${titleMatch[1]}`);
      }
      
      // Look for JSON-LD data
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g);
      if (jsonLdMatches) {
        console.log(`Found ${jsonLdMatches.length} JSON-LD scripts`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRawHtml();