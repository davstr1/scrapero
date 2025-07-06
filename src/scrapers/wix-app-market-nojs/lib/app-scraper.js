const cheerio = require('cheerio');
const pLimit = require('p-limit').default;
const HttpClient = require('./http-client');
const Extractors = require('./extractors');
const Utils = require('./utils');
const CategoryMapper = require('./category-mapper');
const config = require('../config.json');

class AppScraper {
  constructor() {
    this.httpClient = new HttpClient();
    this.concurrencyLimit = pLimit(config.http.concurrency);
    this.results = [];
    this.errors = [];
  }

  async scrapeApps(appUrls, options = {}) {
    console.log(`\nStarting to scrape ${appUrls.length} apps...`);
    
    const startTime = Date.now();
    let completed = 0;
    
    // Process apps with concurrency limit
    const promises = appUrls.map(appInfo => 
      this.concurrencyLimit(async () => {
        try {
          const appData = await this.scrapeApp(appInfo);
          this.results.push(appData);
          completed++;
          
          if (completed % 10 === 0) {
            console.log(`Progress: ${completed}/${appUrls.length} apps scraped`);
          }
          
          return appData;
        } catch (error) {
          console.error(`Failed to scrape ${appInfo.slug}:`, error.message);
          this.errors.push({
            app: appInfo,
            error: error.message,
            timestamp: Utils.getTimestamp()
          });
          return null;
        }
      })
    );
    
    await Promise.all(promises);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\nScraping completed in ${duration.toFixed(2)} seconds`);
    console.log(`Success: ${this.results.length}`);
    console.log(`Errors: ${this.errors.length}`);
    
    return {
      results: this.results,
      errors: this.errors,
      stats: {
        total: appUrls.length,
        success: this.results.length,
        failed: this.errors.length,
        duration
      }
    };
  }

  async scrapeApp(appInfo) {
    const response = await this.httpClient.get(appInfo.url);
    const $ = cheerio.load(response.data);
    
    // Extract all app data
    const appData = {
      // Basic info
      slug: appInfo.slug,
      url: appInfo.url,
      name: Extractors.extractAppName($) || appInfo.name,
      category: '',
      
      // Ratings and reviews
      rating: Extractors.extractRating($),
      reviewCount: Extractors.extractReviewCount($),
      
      // Installation info
      installs: Extractors.extractInstalls($),
      
      // Developer info
      developer: Extractors.extractDeveloper($),
      
      // Description and features
      description: Extractors.extractDescription($),
      features: Extractors.extractFeatures($),
      
      // Pricing
      ...Extractors.extractPricing($),
      
      // Media
      icon: Extractors.extractIcon($),
      screenshots: Extractors.extractScreenshots($),
      
      // Additional metadata
      tags: Extractors.extractTags($),
      lastUpdated: Extractors.extractLastUpdated($),
      
      // Subcategories
      subcategories: Extractors.extractSubcategories($),
      
      // Scraping metadata
      scrapedAt: Utils.getTimestamp()
    };
    
    // Extract additional developer info if present
    this.extractDeveloperDetails($, appData);
    
    // Extract review breakdown if available
    this.extractReviewBreakdown($, appData);
    
    // Detect category based on app data
    appData.category = CategoryMapper.detectCategory(appData);
    
    return appData;
  }

  extractDeveloperDetails($, appData) {
    // Look for developer website
    const websitePatterns = [
      /website[:\s]+([^\s]+)/i,
      /visit[:\s]+([^\s]+)/i
    ];
    
    const bodyText = $('body').text();
    for (const pattern of websitePatterns) {
      const match = bodyText.match(pattern);
      if (match && match[1].includes('.')) {
        appData.developerWebsite = match[1];
        break;
      }
    }
    
    // Look for support email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = bodyText.match(emailPattern);
    if (emails) {
      // Filter out common false positives
      const supportEmail = emails.find(email => 
        email.includes('support') || 
        email.includes('help') ||
        email.includes('contact')
      );
      appData.supportEmail = supportEmail || emails[0];
    }
  }

  extractReviewBreakdown($, appData) {
    // Try to find star breakdown
    const starBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    let foundBreakdown = false;
    
    // Look for patterns like "5 stars (123)"
    for (let stars = 5; stars >= 1; stars--) {
      const patterns = [
        new RegExp(`${stars}\\s*stars?\\s*\\(?(\\d+)\\)?`, 'i'),
        new RegExp(`${stars}\\s*★+\\s*\\(?(\\d+)\\)?`, 'i')
      ];
      
      const bodyText = $('body').text();
      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          starBreakdown[stars] = parseInt(match[1]);
          foundBreakdown = true;
          break;
        }
      }
    }
    
    if (foundBreakdown) {
      appData.reviewBreakdown = starBreakdown;
    }
  }

  async saveResults(results, format = 'csv') {
    if (format === 'csv') {
      await this.saveAsCSV(results);
    } else if (format === 'json') {
      await this.saveAsJSON(results);
    }
  }

  async saveAsCSV(results) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    
    const csvWriter = createCsvWriter({
      path: config.output.appsFile,
      header: [
        { id: 'slug', title: 'Slug' },
        { id: 'name', title: 'Name' },
        { id: 'url', title: 'URL' },
        { id: 'category', title: 'Category' },
        { id: 'additionalCategories', title: 'Additional Categories' },
        { id: 'subcategories', title: 'Subcategories' },
        { id: 'allSubcategories', title: 'All Subcategories' },
        { id: 'rating', title: 'Rating' },
        { id: 'reviewCount', title: 'Reviews' },
        { id: 'installs', title: 'Installs' },
        { id: 'developer', title: 'Developer' },
        { id: 'description', title: 'Description' },
        { id: 'hasFreeVersion', title: 'Has Free Version' },
        { id: 'icon', title: 'Icon URL' },
        { id: 'lastUpdated', title: 'Last Updated' },
        { id: 'scrapedAt', title: 'Scraped At' }
      ]
    });
    
    // Flatten data for CSV
    const flattenedData = results.map(app => ({
      ...app,
      features: app.features ? app.features.join('; ') : '',
      screenshots: app.screenshots ? app.screenshots.join('; ') : '',
      tags: app.tags ? app.tags.join(', ') : '',
      tiers: app.tiers ? JSON.stringify(app.tiers) : '',
      subcategories: app.subcategories ? app.subcategories.map(sc => `${sc.id}:${sc.displayName}`).join('; ') : '',
      additionalCategories: app.additionalCategories ? app.additionalCategories.join('; ') : '',
      allSubcategories: app.allSubcategories ? app.allSubcategories.map(sc => `${sc.id}:${sc.displayName}`).join('; ') : ''
    }));
    
    await csvWriter.writeRecords(flattenedData);
    console.log(`\nResults saved to ${config.output.appsFile}`);
  }

  async saveAsJSON(results) {
    const jsonPath = config.output.appsFile.replace('.csv', '.json');
    await Utils.writeJsonFile(jsonPath, {
      timestamp: Utils.getTimestamp(),
      count: results.length,
      apps: results
    });
    console.log(`\nResults saved to ${jsonPath}`);
  }
}

module.exports = AppScraper;