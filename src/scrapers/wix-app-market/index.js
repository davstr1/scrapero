#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Import modules
const BrowserManager = require('./lib/browser-manager');
const CategoryMapper = require('./lib/category-mapper');
const UrlCollector = require('./lib/url-collector');
const AppScraper = require('./lib/app-scraper');

// Load configuration
const config = require('./config/config.json');

program
  .name('wix-scraper')
  .description('Wix App Market Scraper')
  .version('1.0.0');

program
  .command('discover-categories')
  .description('Discover all categories and subcategories')
  .option('-o, --output <file>', 'Output file for categories', 'temp/categories.json')
  .action(async (options) => {
    const browserManager = new BrowserManager(config);
    
    try {
      await browserManager.initialize(1); // Use single browser for discovery
      const categoryMapper = new CategoryMapper(config, browserManager);
      
      const categories = await categoryMapper.discoverCategories();
      await categoryMapper.saveCategories(options.output);
      
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
      process.exit(1);
    } finally {
      await browserManager.shutdown();
    }
  });

program
  .command('collect-urls')
  .description('Collect all app URLs from categories')
  .option('-i, --input <file>', 'Input categories file', 'temp/categories.json')
  .option('-o, --output <file>', 'Output file for URLs', 'temp/app-urls.csv')
  .option('-r, --resume', 'Resume from last position')
  .action(async (options) => {
    const browserManager = new BrowserManager(config);
    
    try {
      await browserManager.initialize();
      
      // Load categories
      const categoryMapper = new CategoryMapper(config, browserManager);
      await categoryMapper.loadCategories(options.input);
      const categoryList = categoryMapper.getCategoryList();
      
      // Collect URLs
      const urlCollector = new UrlCollector(config, browserManager);
      await urlCollector.collectAllUrls(categoryList, options.output, {
        resume: options.resume
      });
      
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
      process.exit(1);
    } finally {
      await browserManager.shutdown();
    }
  });

program
  .command('scrape-apps')
  .description('Scrape detailed information for all apps')
  .option('-i, --input <file>', 'Input URLs file', 'temp/app-urls.csv')
  .option('-o, --output <file>', 'Output file for app data', 'output/wix-apps.csv')
  .option('-r, --resume', 'Resume from last position')
  .option('-l, --limit <number>', 'Limit number of apps to scrape', parseInt)
  .action(async (options) => {
    const browserManager = new BrowserManager(config);
    
    try {
      await browserManager.initialize();
      
      // Load URLs
      const urlCollector = new UrlCollector(config, browserManager);
      const urls = await urlCollector.loadUrlsFromCsv(options.input);
      
      // Scrape apps
      const appScraper = new AppScraper(config, browserManager);
      await appScraper.scrapeApps(urls, options.output, {
        resume: options.resume,
        limit: options.limit
      });
      
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
      process.exit(1);
    } finally {
      await browserManager.shutdown();
    }
  });

program
  .command('full')
  .description('Run full scraping pipeline')
  .option('-r, --resume', 'Resume any interrupted step')
  .action(async (options) => {
    console.log(chalk.green('🚀 Running full Wix App Market scraping pipeline...'));
    
    const browserManager = new BrowserManager(config);
    
    try {
      // Step 1: Discover categories
      if (!options.resume || !fs.existsSync('temp/categories.json')) {
        console.log(chalk.blue('\n📂 Step 1: Discovering categories...'));
        await browserManager.initialize(1);
        const categoryMapper = new CategoryMapper(config, browserManager);
        await categoryMapper.discoverCategories();
        await categoryMapper.saveCategories('temp/categories.json');
        await browserManager.shutdown();
      } else {
        console.log(chalk.gray('✓ Categories already discovered'));
      }
      
      // Step 2: Collect URLs
      if (!options.resume || !fs.existsSync('temp/app-urls.csv')) {
        console.log(chalk.blue('\n🔗 Step 2: Collecting app URLs...'));
        await browserManager.initialize();
        const categoryMapper = new CategoryMapper(config, browserManager);
        await categoryMapper.loadCategories('temp/categories.json');
        const categoryList = categoryMapper.getCategoryList();
        
        const urlCollector = new UrlCollector(config, browserManager);
        await urlCollector.collectAllUrls(categoryList, 'temp/app-urls.csv', {
          resume: options.resume
        });
        await browserManager.shutdown();
      } else {
        console.log(chalk.gray('✓ URLs already collected'));
      }
      
      // Step 3: Scrape apps
      console.log(chalk.blue('\n📊 Step 3: Scraping app details...'));
      await browserManager.initialize();
      const urlCollector = new UrlCollector(config, browserManager);
      const urls = await urlCollector.loadUrlsFromCsv('temp/app-urls.csv');
      
      const appScraper = new AppScraper(config, browserManager);
      await appScraper.scrapeApps(urls, 'output/wix-apps.csv', {
        resume: options.resume
      });
      
      console.log(chalk.green('\n✨ Full pipeline complete!'));
      
    } catch (error) {
      console.error(chalk.red('Pipeline error:', error.message));
      process.exit(1);
    } finally {
      await browserManager.shutdown();
    }
  });

program
  .command('test')
  .description('Test scraper with a single app')
  .option('-u, --url <url>', 'App URL to test', 'https://www.wix.com/app-market/web-solution/visitor-analytics')
  .action(async (options) => {
    console.log(chalk.blue('🧪 Testing scraper...'));
    
    const browserManager = new BrowserManager(config);
    
    try {
      // Use single browser for testing
      await browserManager.initialize(1);
      
      const appScraper = new AppScraper(config, browserManager);
      
      // Create test URL data
      const testUrl = {
        app_slug: options.url.split('/').pop(),
        app_url: options.url,
        main_category: 'test',
        subcategory: 'test'
      };
      
      console.log(chalk.gray(`Testing with: ${options.url}`));
      
      const result = await appScraper.scrapeApp(testUrl);
      
      // Display results
      console.log(chalk.green('\n✓ Test successful! Extracted data:'));
      console.log(JSON.stringify(result, null, 2));
      
      // Save test result
      const testOutput = 'temp/test-result.json';
      await fs.promises.writeFile(testOutput, JSON.stringify(result, null, 2));
      console.log(chalk.gray(`\nTest result saved to: ${testOutput}`));
      
    } catch (error) {
      console.error(chalk.red('Test failed:', error.message));
      process.exit(1);
    } finally {
      await browserManager.shutdown();
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}