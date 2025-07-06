const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function analyzeSiteStructure() {
  console.log('=== Analyzing Wix Site Structure ===\n');
  
  // 1. Check robots.txt
  console.log('1. Checking robots.txt...');
  try {
    const robotsResponse = await axios.get('https://www.wix.com/robots.txt');
    console.log('Robots.txt found!');
    await fs.writeFile('analysis/robots.txt', robotsResponse.data);
    
    // Look for sitemap references
    const sitemapMatches = robotsResponse.data.match(/Sitemap:\s*(.+)/gi);
    if (sitemapMatches) {
      console.log('Sitemaps found in robots.txt:');
      sitemapMatches.forEach(match => console.log(`  - ${match}`));
    }
  } catch (error) {
    console.error('Error fetching robots.txt:', error.message);
  }
  
  // 2. Check main sitemap
  console.log('\n2. Checking sitemap.xml...');
  const sitemapUrls = [
    'https://www.wix.com/sitemap.xml',
    'https://www.wix.com/app-market/sitemap.xml',
    'https://www.wix.com/sitemap_index.xml',
    'https://www.wix.com/app-market-sitemap.xml'
  ];
  
  for (const url of sitemapUrls) {
    try {
      const response = await axios.get(url);
      console.log(`✓ Found sitemap at ${url}`);
      const filename = url.split('/').pop();
      await fs.writeFile(`analysis/${filename}`, response.data);
      
      // Count app URLs
      const appUrls = response.data.match(/\/web-solution\/[^<]+/g);
      if (appUrls) {
        console.log(`  Found ${appUrls.length} app URLs!`);
        
        // Save unique app slugs
        const uniqueSlugs = [...new Set(appUrls.map(url => url.split('/')[2]))];
        await fs.writeFile('analysis/sitemap-apps.json', JSON.stringify(uniqueSlugs, null, 2));
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.log(`✗ ${url} - ${error.response?.status || error.message}`);
      }
    }
  }
  
  // 3. Test pagination patterns
  console.log('\n3. Testing pagination patterns...');
  const testCategory = 'marketing';
  const paginationPatterns = [
    `https://www.wix.com/app-market/category/${testCategory}?page=2`,
    `https://www.wix.com/app-market/category/${testCategory}?p=2`,
    `https://www.wix.com/app-market/category/${testCategory}?offset=20`,
    `https://www.wix.com/app-market/category/${testCategory}/2`,
    `https://www.wix.com/app-market/category/${testCategory}#page=2`
  ];
  
  for (const url of paginationPatterns) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const appLinks = $('a[href*="/web-solution/"]').length;
      console.log(`${url} - ${response.status} - ${appLinks} apps found`);
      
      if (appLinks > 0) {
        console.log('  ✓ Pagination pattern works!');
      }
    } catch (error) {
      console.log(`${url} - ${error.response?.status || error.message}`);
    }
  }
  
  // 4. Analyze page source for API endpoints
  console.log('\n4. Analyzing page source for API endpoints...');
  try {
    const response = await axios.get('https://www.wix.com/app-market/category/marketing', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    // Look for API patterns
    const apiPatterns = [
      /_api\/[^"']+/g,
      /\/api\/[^"']+/g,
      /graphql/gi,
      /ajax[^"']+/gi,
      /endpoint[^"']+/gi
    ];
    
    console.log('Looking for API endpoints...');
    for (const pattern of apiPatterns) {
      const matches = response.data.match(pattern);
      if (matches) {
        console.log(`Found ${pattern}:`, [...new Set(matches)].slice(0, 3));
      }
    }
    
    // Look for data attributes
    const $ = cheerio.load(response.data);
    const dataAttrs = [];
    $('[data-*]').each((i, el) => {
      const attrs = Object.keys(el.attribs).filter(attr => attr.startsWith('data-'));
      dataAttrs.push(...attrs);
    });
    
    const uniqueDataAttrs = [...new Set(dataAttrs)];
    console.log(`\nFound ${uniqueDataAttrs.length} unique data attributes`);
    console.log('Sample:', uniqueDataAttrs.slice(0, 10));
    
  } catch (error) {
    console.error('Error analyzing page:', error.message);
  }
  
  // 5. Check for "View All" patterns
  console.log('\n5. Looking for "View All" link patterns...');
  try {
    const response = await axios.get('https://www.wix.com/app-market', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const viewAllLinks = [];
    
    $('a').each((i, el) => {
      const text = $(el).text();
      const href = $(el).attr('href');
      if (text.match(/view all|see all|show all|all apps/i) && href) {
        viewAllLinks.push({ text: text.trim(), href });
      }
    });
    
    console.log(`Found ${viewAllLinks.length} "View All" links:`);
    viewAllLinks.forEach(link => console.log(`  - "${link.text}" -> ${link.href}`));
    
  } catch (error) {
    console.error('Error checking view all links:', error.message);
  }
  
  console.log('\n=== Analysis Complete ===');
  console.log('Check the analysis/ directory for saved files');
}

// Create analysis directory
async function setup() {
  await fs.mkdir('analysis', { recursive: true });
  await analyzeSiteStructure();
}

setup().catch(console.error);