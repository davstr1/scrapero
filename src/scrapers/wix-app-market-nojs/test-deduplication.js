const UrlDiscovery = require('./lib/url-discovery');
const AppScraper = require('./lib/app-scraper');
const fs = require('fs').promises;

async function testDeduplication() {
  console.log('=== Testing Wix Scraper Deduplication ===\n');
  
  try {
    // Test URL discovery with limited categories
    const discovery = new UrlDiscovery();
    
    // Override the discovery to test specific categories
    discovery.discoveredUrls.categories = [
      { slug: 'marketing', name: 'Marketing', url: 'https://www.wix.com/app-market/category/marketing' },
      { slug: 'ecommerce', name: 'eCommerce', url: 'https://www.wix.com/app-market/category/ecommerce' }
    ];
    
    console.log('Testing with 2 categories that likely have overlapping apps...\n');
    
    // Discover apps from these categories
    await discovery.discoverAppUrls();
    
    // Check for duplicates
    const appSlugs = discovery.discoveredUrls.apps.map(app => app.slug);
    const uniqueSlugs = [...new Set(appSlugs)];
    
    console.log(`\nDeduplication Test Results:`);
    console.log(`- Total apps discovered: ${appSlugs.length}`);
    console.log(`- Unique apps: ${uniqueSlugs.length}`);
    console.log(`- Duplicates removed: ${appSlugs.length - uniqueSlugs.length}`);
    
    // Find apps that appear in both categories
    const appsBySlug = new Map();
    for (const app of discovery.discoveredUrls.apps) {
      if (!appsBySlug.has(app.slug)) {
        appsBySlug.set(app.slug, []);
      }
      appsBySlug.get(app.slug).push(app.category);
    }
    
    const multiCategoryApps = Array.from(appsBySlug.entries())
      .filter(([slug, categories]) => categories.length > 1)
      .map(([slug, categories]) => ({ slug, categories }));
    
    console.log(`\nApps found in multiple categories: ${multiCategoryApps.length}`);
    if (multiCategoryApps.length > 0) {
      console.log('Sample multi-category apps:');
      multiCategoryApps.slice(0, 5).forEach(app => {
        console.log(`  - ${app.slug}: ${app.categories.join(', ')}`);
      });
    }
    
    // Now test the scraper with a few apps
    console.log('\n\nTesting full scraper with 5 apps...');
    const scraper = new AppScraper();
    const testApps = discovery.discoveredUrls.apps.slice(0, 5);
    
    const results = [];
    for (const app of testApps) {
      console.log(`Scraping ${app.slug}...`);
      const appData = await scraper.scrapeApp(app.slug);
      if (appData) {
        results.push(appData);
      }
    }
    
    // Save test results
    await scraper.saveAsCSV(results);
    await scraper.saveAsJSON(results);
    
    // Verify CSV has no duplicates
    const csvContent = await fs.readFile('data/apps.csv', 'utf-8');
    const csvLines = csvContent.split('\n').filter(line => line.trim());
    const csvSlugs = csvLines.slice(1).map(line => line.split(',')[0]);
    const uniqueCsvSlugs = [...new Set(csvSlugs)];
    
    console.log(`\nCSV Validation:`);
    console.log(`- Total rows (excluding header): ${csvSlugs.length}`);
    console.log(`- Unique slugs: ${uniqueCsvSlugs.length}`);
    console.log(`- Duplicates in CSV: ${csvSlugs.length - uniqueCsvSlugs.length}`);
    
    if (csvSlugs.length === uniqueCsvSlugs.length) {
      console.log('✅ CSV has no duplicates!');
    } else {
      console.log('❌ CSV contains duplicates!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDeduplication().catch(console.error);