const AppScraper = require('./lib/app-scraper');

async function testScrapeWithCategories() {
  console.log('Testing Scraper with Category Detection\n');
  
  const scraper = new AppScraper();
  
  // Test apps from different categories
  const testApps = [
    { slug: 'wix-stores', name: 'Wix Stores', url: 'https://www.wix.com/app-market/web-solution/wix-stores' },
    { slug: 'spocket-dropshipping', name: 'Spocket - US & EU Dropshipping', url: 'https://www.wix.com/app-market/web-solution/spocket-dropshipping' },
    { slug: 'tiktok', name: 'TikTok Ads', url: 'https://www.wix.com/app-market/web-solution/tiktok' },
    { slug: 'age-verification', name: 'Age Verification', url: 'https://www.wix.com/app-market/web-solution/age-verification' },
    { slug: 'countdown-timer', name: 'Countdown Timer', url: 'https://www.wix.com/app-market/web-solution/countdown-timer' }
  ];
  
  console.log('Scraping apps and detecting categories...\n');
  
  for (const app of testApps) {
    try {
      console.log(`Scraping: ${app.name}`);
      const result = await scraper.scrapeApp(app);
      
      console.log(`  Name: ${result.name}`);
      console.log(`  Category: ${result.category}`);
      console.log(`  Rating: ${result.rating}`);
      console.log(`  Reviews: ${result.reviewCount}`);
      console.log(`  Developer: ${result.developer}`);
      console.log('');
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }
  
  console.log('Test complete!');
}

testScrapeWithCategories().catch(console.error);