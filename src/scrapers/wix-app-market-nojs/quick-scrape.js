const SitemapParser = require('./lib/sitemap-parser');
const AppScraper = require('./lib/app-scraper');
const Utils = require('./lib/utils');

async function quickScrapeFromSitemap() {
  console.log('=== Quick Wix Scrape from Sitemap ===\n');
  
  // Get apps from sitemap
  console.log('1. Fetching apps from sitemap...');
  const sitemapParser = new SitemapParser();
  const apps = await sitemapParser.getAppUrls();
  
  console.log(`Found ${apps.length} apps in sitemap\n`);
  
  // Save URL list
  await Utils.writeJsonFile('data/sitemap-urls.json', {
    timestamp: Utils.getTimestamp(),
    count: apps.length,
    apps
  });
  
  // Test with first 10 apps
  console.log('2. Testing scraper with first 10 apps...');
  const testApps = apps.slice(0, 10);
  
  const scraper = new AppScraper();
  const results = await scraper.scrapeApps(testApps);
  
  console.log('\nTest Results:');
  console.log(`Success: ${results.stats.success}`);
  console.log(`Failed: ${results.stats.failed}`);
  
  // Show sample data
  if (results.results.length > 0) {
    console.log('\nSample app data:');
    const sample = results.results[0];
    console.log(`- Name: ${sample.name}`);
    console.log(`- Rating: ${sample.rating}`);
    console.log(`- Reviews: ${sample.reviewCount}`);
    console.log(`- Developer: ${sample.developer}`);
    console.log(`- Installs: ${sample.installs || 'Not found'}`);
    console.log(`- Has free version: ${sample.hasFreeVersion}`);
  }
  
  // Save test results
  await scraper.saveResults(results.results, 'csv');
  
  console.log('\nReady to scrape all apps? Run:');
  console.log('node quick-scrape.js --all');
  
  if (process.argv.includes('--all')) {
    console.log('\n3. Scraping ALL apps from sitemap...');
    console.log('This will take approximately 20-30 minutes with 20 concurrent requests\n');
    
    const fullResults = await scraper.scrapeApps(apps);
    
    console.log('\n=== Final Results ===');
    console.log(`Total apps: ${fullResults.stats.total}`);
    console.log(`Success: ${fullResults.stats.success}`);
    console.log(`Failed: ${fullResults.stats.failed}`);
    console.log(`Duration: ${fullResults.stats.duration.toFixed(2)} seconds`);
    console.log(`Rate: ${(fullResults.stats.success / fullResults.stats.duration).toFixed(2)} apps/second`);
    
    // Save full results
    await scraper.saveResults(fullResults.results, 'csv');
    await scraper.saveResults(fullResults.results, 'json');
    
    console.log('\nScrape complete! Check data/apps.csv for results');
  }
}

quickScrapeFromSitemap().catch(console.error);