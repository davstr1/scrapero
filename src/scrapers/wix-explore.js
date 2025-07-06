const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function exploreWixAppMarket() {
  console.log('Exploring Wix App Market structure...\n');
  
  // First, try simple HTTP request
  try {
    console.log('1. Testing basic HTTP request...');
    const response = await axios.get('https://www.wix.com/app-market/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    console.log('Page title:', $('title').text());
    console.log('Meta description:', $('meta[name="description"]').attr('content'));
    
    // Look for app elements
    const appElements = $('[data-testid*="app"], [class*="app-card"], [class*="AppCard"]').length;
    console.log('Potential app elements found:', appElements);
    
    // Check for Next.js or React
    const hasNext = response.data.includes('__NEXT_DATA__');
    const hasReact = response.data.includes('react');
    console.log('Next.js detected:', hasNext);
    console.log('React detected:', hasReact);
    
    // Look for data in script tags
    const scripts = $('script').filter((i, el) => {
      const content = $(el).html() || '';
      return content.includes('apps') || content.includes('categories');
    });
    console.log('Data scripts found:', scripts.length);
    
  } catch (error) {
    console.log('Basic HTTP request failed:', error.message);
  }
  
  console.log('\n2. Testing with Puppeteer (headless browser)...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Enable request interception to log API calls
    await page.setRequestInterception(true);
    const apiCalls = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('api') || url.includes('graphql') || url.includes('.json')) {
        apiCalls.push({
          url: url,
          method: request.method(),
          type: request.resourceType()
        });
      }
      request.continue();
    });
    
    // Navigate to main page
    console.log('Loading main page...');
    await page.goto('https://www.wix.com/app-market/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract page data
    const pageData = await page.evaluate(() => {
      return {
        title: document.title,
        categories: Array.from(document.querySelectorAll('a[href*="/category/"]')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        })),
        appCards: Array.from(document.querySelectorAll('[data-hook="app-card"], [class*="app-card"]')).length,
        viewAllButtons: Array.from(document.querySelectorAll('a[href*="view-all"], button:contains("View All")')).length
      };
    });
    
    console.log('Page data:', JSON.stringify(pageData, null, 2));
    
    // Log API calls
    console.log('\nAPI calls detected:', apiCalls.length);
    apiCalls.slice(0, 5).forEach(call => {
      console.log(`- ${call.method} ${call.url.substring(0, 100)}...`);
    });
    
    // Test a category page
    console.log('\n3. Testing category page...');
    await page.goto('https://www.wix.com/app-market/category/marketing', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const categoryData = await page.evaluate(() => {
      return {
        subcategories: Array.from(document.querySelectorAll('[data-hook="subcategory"], [class*="subcategory"]')).map(el => el.textContent.trim()),
        totalApps: document.body.textContent.match(/(\d+)\s+apps?/gi),
        hasLoadMore: !!document.querySelector('button:contains("Load More"), button:contains("Show More")')
      };
    });
    
    console.log('Category data:', JSON.stringify(categoryData, null, 2));
    
    // Test an app detail page
    console.log('\n4. Testing app detail page...');
    await page.goto('https://www.wix.com/app-market/web-solution/visitor-analytics', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const appData = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };
      
      return {
        name: getText('h1'),
        rating: getText('[class*="rating"]'),
        installs: getText('[class*="installs"], [class*="downloads"]'),
        price: getText('[class*="price"]'),
        developer: getText('[class*="developer"], [class*="vendor"]'),
        hasReviews: !!document.querySelector('[class*="review"]'),
        hasScreenshots: !!document.querySelector('img[alt*="screenshot"], [class*="screenshot"]')
      };
    });
    
    console.log('App data:', JSON.stringify(appData, null, 2));
    
  } catch (error) {
    console.error('Puppeteer error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the exploration
exploreWixAppMarket().catch(console.error);