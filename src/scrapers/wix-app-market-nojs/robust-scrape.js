const SitemapParser = require('./lib/sitemap-parser');
const AppScraper = require('./lib/app-scraper');
const Utils = require('./lib/utils');
const fs = require('fs').promises;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function robustScrape() {
  console.log('=== Robust Wix Scraper with Progress Saving ===\n');
  
  // Load progress if exists
  let progress = {
    completedSlugs: [],
    lastIndex: 0,
    startTime: Date.now()
  };
  
  try {
    const saved = await Utils.readJsonFile('data/scrape-progress.json');
    if (saved) {
      progress = saved;
      console.log(`Resuming from index ${progress.lastIndex}`);
      console.log(`Already scraped: ${progress.completedSlugs.length} apps\n`);
    }
  } catch (e) {}
  
  // Get apps from sitemap
  console.log('1. Loading apps from sitemap...');
  const sitemapParser = new SitemapParser();
  const allApps = await sitemapParser.getAppUrls();
  console.log(`Found ${allApps.length} apps in sitemap\n`);
  
  // Filter out already completed
  const remainingApps = allApps.filter(app => !progress.completedSlugs.includes(app.slug));
  console.log(`Remaining to scrape: ${remainingApps.length} apps\n`);
  
  if (remainingApps.length === 0) {
    console.log('All apps already scraped!');
    return;
  }
  
  // Set up CSV writer
  const csvWriter = createCsvWriter({
    path: 'data/apps-full.csv',
    header: [
      { id: 'slug', title: 'Slug' },
      { id: 'name', title: 'Name' },
      { id: 'url', title: 'URL' },
      { id: 'category', title: 'Category' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviewCount', title: 'Reviews' },
      { id: 'installs', title: 'Installs' },
      { id: 'developer', title: 'Developer' },
      { id: 'description', title: 'Description' },
      { id: 'hasFreeVersion', title: 'Has Free Version' },
      { id: 'icon', title: 'Icon URL' },
      { id: 'lastUpdated', title: 'Last Updated' },
      { id: 'scrapedAt', title: 'Scraped At' }
    ],
    append: progress.completedSlugs.length > 0 // Append if resuming
  });
  
  // Process in batches
  const BATCH_SIZE = 50;
  const scraper = new AppScraper();
  
  for (let i = 0; i < remainingApps.length; i += BATCH_SIZE) {
    const batch = remainingApps.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remainingApps.length / BATCH_SIZE);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} apps)...`);
    
    try {
      const results = await scraper.scrapeApps(batch);
      
      // Save successful results to CSV
      if (results.results.length > 0) {
        await csvWriter.writeRecords(results.results);
        
        // Update progress
        const successfulSlugs = results.results.map(r => r.slug);
        progress.completedSlugs.push(...successfulSlugs);
        progress.lastIndex = progress.lastIndex + batch.length;
        
        // Save progress
        await Utils.writeJsonFile('data/scrape-progress.json', progress);
        
        console.log(`Batch complete: ${results.stats.success} success, ${results.stats.failed} failed`);
        console.log(`Total progress: ${progress.completedSlugs.length}/${allApps.length} apps`);
        
        // Calculate ETA
        const elapsed = (Date.now() - progress.startTime) / 1000;
        const rate = progress.completedSlugs.length / elapsed;
        const remaining = allApps.length - progress.completedSlugs.length;
        const eta = remaining / rate;
        
        console.log(`Rate: ${rate.toFixed(2)} apps/second`);
        console.log(`ETA: ${(eta / 60).toFixed(1)} minutes`);
      }
      
    } catch (error) {
      console.error(`Batch ${batchNum} failed:`, error.message);
    }
    
    // Small delay between batches
    if (i + BATCH_SIZE < remainingApps.length) {
      console.log('Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final summary
  console.log('\n=== Scraping Complete ===');
  console.log(`Total apps scraped: ${progress.completedSlugs.length}`);
  console.log(`Failed: ${allApps.length - progress.completedSlugs.length}`);
  console.log(`Duration: ${((Date.now() - progress.startTime) / 1000 / 60).toFixed(1)} minutes`);
  console.log('\nResults saved to data/apps-full.csv');
  
  // Clean up progress file
  await fs.unlink('data/scrape-progress.json').catch(() => {});
}

robustScrape().catch(console.error);