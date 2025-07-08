const path = require('path');
const ApiFetcher = require('./lib/api-fetcher');
const { transformBatch } = require('./lib/transformers');
const CsvAdapter = require('./outputs/csv-adapter');
const JsonAdapter = require('./outputs/json-adapter');
const config = require('./config.json');

class WixRoadmapScraper {
  constructor() {
    this.apiFetcher = new ApiFetcher();
    this.outputDir = path.join(process.cwd(), config.outputDir);
    this.seenIds = new Set();
    this.stats = {
      totalItems: 0,
      duplicates: 0,
      errors: 0,
      pagesProcessed: 0
    };
  }

  async init() {
    console.log('=== Wix Roadmap Scraper ===');
    console.log(`Output directory: ${this.outputDir}`);
    console.log(`Rate limit: ${config.rateLimit.maxRequestsPerSecond} requests/second`);
    
    // Initialize output adapters
    this.outputs = [];
    
    if (config.outputs.includes('csv')) {
      const csvAdapter = new CsvAdapter(this.outputDir);
      await csvAdapter.init();
      this.outputs.push(csvAdapter);
    }
    
    if (config.outputs.includes('json')) {
      const jsonAdapter = new JsonAdapter(this.outputDir);
      await jsonAdapter.init();
      this.outputs.push(jsonAdapter);
    }
  }

  async scrape(options = {}) {
    const startTime = Date.now();
    
    try {
      await this.init();
      
      if (options.test) {
        // Test mode - fetch limited items
        await this.scrapeTest(options.limit || 10);
      } else {
        // Full scrape with pagination
        await this.scrapeFull();
      }
      
      // Finalize outputs
      await this.finalize();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.printStats(duration);
      
    } catch (error) {
      console.error('\nScraper failed:', error.message);
      throw error;
    }
  }

  async scrapeTest(limit) {
    console.log(`\n--- TEST MODE: Fetching ${limit} items ---`);
    
    const data = await this.apiFetcher.fetchLimited(limit);
    console.log(`Total items available: ${data.totalCount}`);
    
    // Transform and deduplicate
    const transformedItems = this.processItems(data.items);
    
    // Write to outputs
    await this.writeToOutputs(transformedItems);
    
    this.stats.pagesProcessed = 1;
  }

  async scrapeFull() {
    console.log('\n--- FULL SCRAPE MODE ---');
    
    const allItems = [];
    
    // Process all pages
    for await (const pageData of this.apiFetcher.fetchAllPages()) {
      const transformedItems = this.processItems(pageData.items);
      allItems.push(...transformedItems);
      
      // Write batch to outputs
      await this.writeToOutputs(transformedItems);
      
      this.stats.pagesProcessed++;
      
      // Progress update
      if (pageData.totalCount) {
        const progress = ((allItems.length / pageData.totalCount) * 100).toFixed(1);
        console.log(`Progress: ${allItems.length}/${pageData.totalCount} items (${progress}%)`);
      }
    }
  }

  processItems(items) {
    // Transform items
    const transformed = transformBatch(items);
    
    // Deduplicate
    const deduplicated = transformed.filter(item => {
      if (this.seenIds.has(item.id)) {
        this.stats.duplicates++;
        return false;
      }
      this.seenIds.add(item.id);
      return true;
    });
    
    this.stats.totalItems += deduplicated.length;
    
    return deduplicated;
  }

  async writeToOutputs(items) {
    if (items.length === 0) return;
    
    for (const output of this.outputs) {
      try {
        await output.write(items);
      } catch (error) {
        console.error(`Error writing to ${output.constructor.name}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  async finalize() {
    console.log('\nFinalizing outputs...');
    
    for (const output of this.outputs) {
      try {
        await output.finalize();
      } catch (error) {
        console.error(`Error finalizing ${output.constructor.name}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  printStats(duration) {
    console.log('\n=== Scraper Statistics ===');
    console.log(`Total items scraped: ${this.stats.totalItems}`);
    console.log(`Pages processed: ${this.stats.pagesProcessed}`);
    console.log(`Duplicates found: ${this.stats.duplicates}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Items per second: ${(this.stats.totalItems / duration).toFixed(2)}`);
  }
}

// Main execution
async function main() {
  const scraper = new WixRoadmapScraper();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex > -1 ? parseInt(args[limitIndex + 1]) : 10;
  
  await scraper.scrape({
    test: isTest,
    limit: limit
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = WixRoadmapScraper;