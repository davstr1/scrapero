const puppeteer = require('puppeteer');

async function exploreWix() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Intercept API calls
    await page.setRequestInterception(true);
    const apiCalls = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('api') || url.includes('graphql') || url.includes('.json')) {
        apiCalls.push(url);
      }
      request.continue();
    });
    
    console.log('Loading Wix App Market...');
    await page.goto('https://www.wix.com/app-market/', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Take screenshot
    await page.screenshot({ path: 'wix-app-market.png' });
    console.log('Screenshot saved as wix-app-market.png');
    
    // Extract basic data
    const data = await page.evaluate(() => {
      const categories = [];
      document.querySelectorAll('a').forEach(link => {
        if (link.href.includes('/category/')) {
          categories.push({
            text: link.textContent.trim(),
            url: link.href
          });
        }
      });
      
      return {
        title: document.title,
        totalLinks: document.querySelectorAll('a').length,
        categories: categories.slice(0, 20)
      };
    });
    
    console.log('\nPage Analysis:');
    console.log('Title:', data.title);
    console.log('Total links:', data.totalLinks);
    console.log('\nCategories found:');
    data.categories.forEach(cat => {
      console.log(`- ${cat.text}: ${cat.url}`);
    });
    
    console.log('\nAPI calls intercepted:', apiCalls.length);
    apiCalls.slice(0, 10).forEach(url => {
      console.log(`- ${url.substring(0, 100)}...`);
    });
    
    // Visit a category
    console.log('\nVisiting Marketing category...');
    await page.goto('https://www.wix.com/app-market/category/marketing', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    const categoryData = await page.evaluate(() => {
      const apps = [];
      document.querySelectorAll('a').forEach(link => {
        if (link.href.includes('/web-solution/')) {
          const parent = link.closest('div');
          apps.push({
            url: link.href,
            text: link.textContent.trim() || (parent ? parent.textContent.trim().substring(0, 50) : '')
          });
        }
      });
      
      return {
        totalLinks: document.querySelectorAll('a').length,
        appLinks: apps.slice(0, 20)
      };
    });
    
    console.log('\nMarketing Category:');
    console.log('Total links:', categoryData.totalLinks);
    console.log('App links found:', categoryData.appLinks.length);
    categoryData.appLinks.forEach(app => {
      console.log(`- ${app.text}: ${app.url}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

exploreWix().catch(console.error);