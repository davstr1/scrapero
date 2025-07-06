#!/usr/bin/env node

const { program } = require('commander');
const UrlDiscovery = require('./lib/url-discovery');
const CategoryMapping = require('./lib/category-mapping');
const AppScraper = require('./lib/app-scraper');
const Utils = require('./lib/utils');
const config = require('./config.json');

async function discoverCommand(options) {
  console.log('=== Wix App Market URL Discovery ===\n');
  
  // Step 1: Try sitemap first (fastest method)
  console.log('Step 1: Checking sitemap for app URLs...');
  const SitemapParser = require('./lib/sitemap-parser');
  const sitemapParser = new SitemapParser();
  
  let sitemapApps = [];
  try {
    sitemapApps = await sitemapParser.getAppUrls();
    console.log(`✓ Found ${sitemapApps.length} apps in sitemap!`);
  } catch (error) {
    console.error('Error parsing sitemap:', error.message);
  }
  
  // Step 2: Category discovery with pagination
  console.log('\nStep 2: Discovering apps through categories...');
  const discovery = new UrlDiscovery();
  
  // Check if we should resume
  if (options.resume) {
    const existing = await discovery.loadExistingUrls();
    if (existing) {
      console.log('Resuming from existing URL data...\n');
    }
  }
  
  // Discover all URLs
  const urls = await discovery.discoverAll();
  
  // Step 3: Merge results
  console.log('\nStep 3: Merging discovery results...');
  
  // Create a Map to track unique apps by slug
  const uniqueAppsMap = new Map();
  
  // Add sitemap apps first
  for (const app of sitemapApps) {
    uniqueAppsMap.set(app.slug, app);
  }
  
  // Add discovered apps, merging category data if app already exists
  for (const app of urls.apps) {
    if (uniqueAppsMap.has(app.slug)) {
      // App already exists, merge category data
      const existingApp = uniqueAppsMap.get(app.slug);
      
      // Merge categories
      if (!existingApp.additionalCategories) {
        existingApp.additionalCategories = [];
      }
      if (app.category && app.category !== existingApp.category) {
        existingApp.additionalCategories.push(app.category);
      }
      
      // Merge subcategories
      if (app.subcategories && app.subcategories.length > 0) {
        if (!existingApp.allSubcategories) {
          existingApp.allSubcategories = [...(existingApp.subcategories || [])];
        }
        for (const subcat of app.subcategories) {
          if (!existingApp.allSubcategories.some(s => s.id === subcat.id)) {
            existingApp.allSubcategories.push(subcat);
          }
        }
      }
      
      // Merge discovery info
      if (!existingApp.discoveredFrom) {
        existingApp.discoveredFrom = [];
      } else if (typeof existingApp.discoveredFrom === 'string') {
        existingApp.discoveredFrom = [existingApp.discoveredFrom];
      }
      if (app.discoveredFrom && !existingApp.discoveredFrom.includes(app.discoveredFrom)) {
        existingApp.discoveredFrom.push(app.discoveredFrom);
      }
    } else {
      // New app, add to map
      uniqueAppsMap.set(app.slug, app);
    }
  }
  
  // Convert map back to array
  const allApps = Array.from(uniqueAppsMap.values());
  
  // Update the discovery results
  urls.apps = allApps;
  urls.discoveryMethods = {
    sitemap: sitemapApps.length,
    categories: urls.apps.length - sitemapApps.length
  };
  
  // Save the complete results
  await Utils.writeJsonFile(config.output.urlsFile, urls);
  
  // Build and save category structure
  const categoryMapping = new CategoryMapping();
  const structure = await categoryMapping.buildCategoryStructure(urls);
  await categoryMapping.saveCategoryStructure(structure);
  
  console.log('\n=== Discovery Summary ===');
  console.log(`Total unique apps found: ${allApps.length}`);
  console.log(`- From sitemap: ${sitemapApps.length}`);
  console.log(`- From categories: ${urls.apps.length - sitemapApps.length}`);
  
  // Log duplicate statistics
  const totalDiscovered = sitemapApps.length + urls.apps.length;
  const duplicatesRemoved = totalDiscovered - allApps.length;
  console.log(`\nDuplicate Statistics:`);
  console.log(`- Total apps before deduplication: ${totalDiscovered}`);
  console.log(`- Duplicates removed: ${duplicatesRemoved}`);
  console.log(`- Deduplication rate: ${(duplicatesRemoved / totalDiscovered * 100).toFixed(1)}%`);
  
  console.log('\nDiscovery complete!');
}

async function scrapeCommand(options) {
  console.log('=== Wix App Market Scraper ===\n');
  
  // Load discovered URLs
  const urls = await Utils.readJsonFile(config.output.urlsFile);
  if (!urls || !urls.apps || urls.apps.length === 0) {
    console.error('No app URLs found. Please run "discover" command first.');
    process.exit(1);
  }
  
  console.log(`Found ${urls.apps.length} apps to scrape`);
  
  // Apply limit if specified
  let appsToScrape = urls.apps;
  if (options.limit) {
    appsToScrape = appsToScrape.slice(0, options.limit);
    console.log(`Limiting to ${options.limit} apps`);
  }
  
  // Scrape apps
  const scraper = new AppScraper();
  const results = await scraper.scrapeApps(appsToScrape);
  
  // Save results
  const format = options.json ? 'json' : 'csv';
  await scraper.saveResults(results.results, format);
  
  // Save errors if any
  if (results.errors.length > 0) {
    await Utils.writeJsonFile('data/errors.json', results.errors);
    console.log(`\nErrors saved to data/errors.json`);
  }
  
  // Print summary
  console.log('\n=== Scraping Summary ===');
  console.log(`Total apps: ${results.stats.total}`);
  console.log(`Successful: ${results.stats.success}`);
  console.log(`Failed: ${results.stats.failed}`);
  console.log(`Duration: ${results.stats.duration.toFixed(2)} seconds`);
  console.log(`Rate: ${(results.stats.success / results.stats.duration).toFixed(2)} apps/second`);
}

async function fullCommand(options) {
  console.log('=== Wix App Market Full Scrape ===\n');
  
  // Step 1: Discover URLs
  console.log('Step 1: Discovering URLs...\n');
  await discoverCommand(options);
  
  // Step 2: Scrape all apps
  console.log('\nStep 2: Scraping apps...\n');
  await scrapeCommand(options);
  
  console.log('\nFull scrape complete!');
}

async function testCommand() {
  console.log('=== Testing Wix App Market Scraper ===\n');
  
  // Test URL discovery on one category
  console.log('Testing URL discovery...');
  const discovery = new UrlDiscovery();
  await discovery.discoverMainCategories();
  
  if (discovery.discoveredUrls.categories.length === 0) {
    console.error('No categories found!');
    return;
  }
  
  console.log(`Found ${discovery.discoveredUrls.categories.length} categories`);
  console.log('First category:', discovery.discoveredUrls.categories[0]);
  
  // Test scraping one app
  console.log('\nTesting app scraper...');
  const testApp = {
    slug: 'visitor-analytics',
    name: 'Visitor Analytics',
    url: 'https://www.wix.com/app-market/web-solution/visitor-analytics'
  };
  
  const scraper = new AppScraper();
  const result = await scraper.scrapeApp(testApp);
  
  console.log('\nScraped app data:');
  console.log(JSON.stringify(result, null, 2));
  
  // Save test result
  await Utils.writeJsonFile('data/test-result.json', result);
  console.log('\nTest result saved to data/test-result.json');
}

// Set up CLI
program
  .name('wix-scraper')
  .description('Wix App Market scraper without JavaScript')
  .version('1.0.0');

program
  .command('discover')
  .description('Discover all app URLs from Wix App Market')
  .option('-r, --resume', 'Resume from existing URL data')
  .action(discoverCommand);

program
  .command('scrape')
  .description('Scrape app details from discovered URLs')
  .option('-l, --limit <number>', 'Limit number of apps to scrape', parseInt)
  .option('-j, --json', 'Save results as JSON instead of CSV')
  .action(scrapeCommand);

program
  .command('full')
  .description('Run full scraping process: discover URLs then scrape apps')
  .option('-r, --resume', 'Resume any interrupted step')
  .option('-l, --limit <number>', 'Limit number of apps to scrape', parseInt)
  .action(fullCommand);

program
  .command('test')
  .description('Test the scraper with a single app')
  .action(testCommand);

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}