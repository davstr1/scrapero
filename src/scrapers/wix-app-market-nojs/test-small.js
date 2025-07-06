const AppScraper = require('./lib/app-scraper');
const Utils = require('./lib/utils');

async function testSmallScrape() {
  console.log('Testing small scrape...\n');
  
  // Test with a few known apps
  const testApps = [
    {
      slug: 'visitor-analytics',
      name: 'Visitor Analytics',
      url: 'https://www.wix.com/app-market/web-solution/visitor-analytics',
      category: 'marketing'
    },
    {
      slug: 'wix-stores',
      name: 'Wix Stores',
      url: 'https://www.wix.com/app-market/web-solution/wix-stores',
      category: 'ecommerce'
    },
    {
      slug: 'wix-bookings',
      name: 'Wix Bookings',
      url: 'https://www.wix.com/app-market/web-solution/wix-bookings',
      category: 'booking--events'
    }
  ];
  
  const scraper = new AppScraper();
  
  for (const app of testApps) {
    console.log(`\nScraping ${app.name}...`);
    try {
      const result = await scraper.scrapeApp(app);
      
      console.log(`✓ Name: ${result.name}`);
      console.log(`✓ Rating: ${result.rating}`);
      console.log(`✓ Reviews: ${result.reviewCount}`);
      console.log(`✓ Developer: ${result.developer}`);
      console.log(`✓ Installs: ${result.installs || 'Not found'}`);
      console.log(`✓ Free version: ${result.hasFreeVersion}`);
      console.log(`✓ Price tiers: ${result.tiers.length}`);
      
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
  }
  
  console.log('\nTest complete!');
}

testSmallScrape().catch(console.error);