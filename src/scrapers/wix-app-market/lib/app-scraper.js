const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');
const { createReadStream } = require('fs');
const PageHelpers = require('./page-helpers');
const ProgressBar = require('progress');
const pLimit = require('p-limit');

class AppScraper {
  constructor(config, browserManager) {
    this.config = config;
    this.browserManager = browserManager;
    this.pageHelpers = new PageHelpers(config);
    this.progressFile = path.join('temp', 'scrape-progress.json');
    this.failedFile = path.join('temp', 'failed-apps.csv');
    this.results = [];
    this.failed = [];
  }

  async scrapeApps(urls, outputPath, options = {}) {
    const { resume = false, limit = null } = options;
    
    console.log(chalk.blue(`📊 Scraping ${limit || urls.length} apps...`));
    
    // Load progress if resuming
    let startIndex = 0;
    if (resume) {
      const progress = await this.loadProgress();
      startIndex = progress.lastIndex || 0;
      console.log(chalk.yellow(`Resuming from app ${startIndex}`));
    }
    
    // Apply limit if specified
    const urlsToProcess = limit ? urls.slice(startIndex, startIndex + limit) : urls.slice(startIndex);
    
    // Create progress bar
    const progressBar = new ProgressBar('Scraping [:bar] :current/:total apps :percent :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total: urlsToProcess.length
    });
    
    // Create concurrency limiter
    const concurrencyLimit = pLimit(this.config.browser.concurrency);
    
    // Process apps in batches
    const batchSize = this.config.browser.concurrency * 10;
    for (let i = 0; i < urlsToProcess.length; i += batchSize) {
      const batch = urlsToProcess.slice(i, Math.min(i + batchSize, urlsToProcess.length));
      
      const batchPromises = batch.map((urlData, index) =>
        concurrencyLimit(async () => {
          try {
            const appData = await this.scrapeApp(urlData);
            this.results.push(appData);
            progressBar.tick();
            
            // Save progress every 10 apps
            if ((startIndex + i + index + 1) % 10 === 0) {
              await this.saveProgress(startIndex + i + index + 1);
              await this.saveResults(outputPath, true);
            }
            
            return appData;
          } catch (error) {
            console.error(chalk.red(`\n✗ Failed to scrape ${urlData.app_name || urlData.app_slug}:`, error.message));
            this.failed.push({
              ...urlData,
              error: error.message
            });
            progressBar.tick();
            return null;
          }
        })
      );
      
      await Promise.all(batchPromises);
    }
    
    // Save final results
    await this.saveResults(outputPath, false);
    
    // Save failed apps
    if (this.failed.length > 0) {
      await this.saveFailedApps();
      console.log(chalk.yellow(`\n⚠️  ${this.failed.length} apps failed to scrape. See ${this.failedFile}`));
    }
    
    // Clear progress file
    await this.clearProgress();
    
    console.log(chalk.green(`\n✓ Scraping complete! Successfully scraped ${this.results.length} apps`));
    
    return this.results;
  }

  async scrapeApp(urlData) {
    const maxRetries = this.config.retry.maxAttempts;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.browserManager.withPage(async (page) => {
          // Navigate to app page
          const url = urlData.app_url || urlData.url;
          await this.pageHelpers.safeNavigate(page, url);
          
          // Wait for main content
          await this.pageHelpers.waitForContent(page, {
            selector: 'h1',
            timeout: 30000
          });
          
          // Extract app data
          const appData = await this.extractAppData(page, urlData);
          
          return appData;
        });
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(chalk.yellow(`Retry ${attempt}/${maxRetries} for ${urlData.app_name || urlData.app_slug}`));
          await this.pageHelpers.delay(this.config.retry.delay * attempt);
        }
      }
    }
    
    throw lastError || new Error('Max retries reached');
  }

  async extractAppData(page, urlData) {
    const data = {
      // Basic info from URL data
      slug: urlData.app_slug || urlData.slug,
      url: urlData.app_url || urlData.url,
      mainCategory: urlData.main_category || urlData.mainCategory,
      subCategory: urlData.subcategory || urlData.subCategory,
      
      // Extract from page
      name: await this.extractAppName(page),
      icon: await this.extractIcon(page),
      shortDescription: await this.extractShortDescription(page),
      fullDescription: await this.extractFullDescription(page),
      
      // Ratings
      ...await this.extractRatings(page),
      
      // Pricing
      ...await this.extractPricing(page),
      
      // Developer info
      ...await this.extractDeveloperInfo(page),
      
      // Stats
      installCount: await this.extractInstallCount(page),
      
      // Media
      screenshots: await this.extractScreenshots(page),
      
      // Metadata
      tags: await this.extractTags(page),
      languages: await this.extractLanguages(page),
      lastUpdated: await this.extractLastUpdated(page),
      
      // Scraping metadata
      scrapedAt: new Date().toISOString()
    };
    
    return data;
  }

  async extractAppName(page) {
    const selectors = ['h1', '[data-hook="app-name"]', '.app-name'];
    return await this.pageHelpers.extractText(page, selectors);
  }

  async extractIcon(page) {
    const selectors = [
      '[data-hook="app-icon"] img',
      '.app-icon img',
      'img[alt*="icon"]',
      'img[alt*="logo"]'
    ];
    
    for (const selector of selectors) {
      const src = await this.pageHelpers.extractAttribute(page, selector, 'src');
      if (src) return src;
    }
    
    return '';
  }

  async extractShortDescription(page) {
    const selectors = [
      '[data-hook="app-tagline"]',
      '.app-tagline',
      'h2',
      '[class*="subtitle"]'
    ];
    
    return await this.pageHelpers.extractText(page, selectors);
  }

  async extractFullDescription(page) {
    const selectors = [
      '[data-hook="description-content"]',
      '.description-content',
      '[class*="description"] [class*="content"]',
      'section:has(h2:contains("Overview")) p'
    ];
    
    // Try to get all paragraphs in description section
    try {
      const descriptions = await page.$$eval(selectors[0], elements => {
        return elements.map(el => el.textContent.trim()).join('\n\n');
      });
      
      if (descriptions) return descriptions;
    } catch (error) {
      // Continue with single selector approach
    }
    
    return await this.pageHelpers.extractText(page, selectors);
  }

  async extractRatings(page) {
    const result = {
      averageRating: 0,
      totalReviews: 0,
      rating5Star: 0,
      rating4Star: 0,
      rating3Star: 0,
      rating2Star: 0,
      rating1Star: 0
    };
    
    // Extract average rating
    const ratingSelectors = [
      '[data-hook="rating-value"]',
      '.rating-value',
      '[class*="rating"] [class*="value"]'
    ];
    
    const ratingText = await this.pageHelpers.extractText(page, ratingSelectors);
    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
    if (ratingMatch) {
      result.averageRating = parseFloat(ratingMatch[1]);
    }
    
    // Extract total reviews
    const reviewSelectors = [
      '[data-hook="review-count"]',
      '.review-count',
      '[class*="review"] [class*="count"]'
    ];
    
    const reviewText = await this.pageHelpers.extractText(page, reviewSelectors);
    const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
    if (reviewMatch) {
      result.totalReviews = parseInt(reviewMatch[1].replace(/,/g, ''));
    }
    
    // Extract star breakdown
    try {
      const starBreakdown = await page.evaluate(() => {
        const breakdown = {};
        
        // Look for rating bars or similar elements
        const bars = document.querySelectorAll('[data-hook*="rating-bar"], [class*="rating-bar"]');
        bars.forEach(bar => {
          const label = bar.textContent || '';
          for (let i = 5; i >= 1; i--) {
            if (label.includes(`${i} star`) || label.includes(`${i}star`)) {
              const countMatch = label.match(/(\d+(?:,\d+)*)/);
              if (countMatch) {
                breakdown[`rating${i}Star`] = parseInt(countMatch[1].replace(/,/g, ''));
              }
            }
          }
        });
        
        return breakdown;
      });
      
      Object.assign(result, starBreakdown);
    } catch (error) {
      // Ignore rating breakdown errors
    }
    
    return result;
  }

  async extractPricing(page) {
    const result = {
      hasFreeVersion: false,
      pricingTiers: []
    };
    
    // Check for free version
    const freeIndicators = ['free', 'free plan', 'free version', '$0'];
    const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    result.hasFreeVersion = freeIndicators.some(indicator => pageText.includes(indicator));
    
    // Extract pricing tiers
    try {
      const pricingData = await page.evaluate(() => {
        const tiers = [];
        
        // Look for pricing sections
        const pricingElements = document.querySelectorAll(
          '[data-hook*="pricing"], [class*="pricing"], [class*="plan"], [class*="tier"]'
        );
        
        pricingElements.forEach(element => {
          const text = element.textContent;
          const priceMatch = text.match(/\$?\d+(?:\.\d{2})?/);
          const periodMatch = text.match(/\/(month|year|mo|yr)/i);
          
          if (priceMatch) {
            tiers.push({
              name: text.split(priceMatch[0])[0].trim(),
              price: priceMatch[0],
              period: periodMatch ? periodMatch[1] : 'month'
            });
          }
        });
        
        return tiers;
      });
      
      result.pricingTiers = JSON.stringify(pricingData);
    } catch (error) {
      result.pricingTiers = '[]';
    }
    
    return result;
  }

  async extractDeveloperInfo(page) {
    const result = {
      developer: '',
      developerEmail: '',
      developerWebsite: ''
    };
    
    // Extract developer name
    const devSelectors = [
      '[data-hook="developer-name"]',
      '.developer-name',
      '[class*="developer"] [class*="name"]',
      'a[href*="/developer/"]'
    ];
    
    result.developer = await this.pageHelpers.extractText(page, devSelectors);
    
    // Extract email
    try {
      const emailElement = await page.$('a[href^="mailto:"]');
      if (emailElement) {
        const href = await emailElement.getAttribute('href');
        result.developerEmail = href.replace('mailto:', '');
      }
    } catch (error) {
      // Ignore email extraction errors
    }
    
    // Extract website
    const websiteSelectors = [
      '[data-hook="developer-website"]',
      '.developer-website',
      'a[href*="http"]:contains("website")'
    ];
    
    result.developerWebsite = await this.pageHelpers.extractAttribute(page, websiteSelectors[0], 'href') || '';
    
    return result;
  }

  async extractInstallCount(page) {
    const selectors = [
      '[data-hook="installs-count"]',
      '.installs-count',
      '[class*="install"] [class*="count"]',
      ':contains("installs")',
      ':contains("users")'
    ];
    
    const text = await this.pageHelpers.extractText(page, selectors);
    
    // Clean up the text (remove "installs", "users", etc.)
    return text
      .replace(/installs?/i, '')
      .replace(/users?/i, '')
      .replace(/\+/g, '')
      .trim();
  }

  async extractScreenshots(page) {
    try {
      const screenshots = await page.$$eval(
        '[data-hook="screenshot"] img, .screenshot img, [class*="screenshot"] img',
        images => images.map(img => img.src).filter(src => src && !src.includes('placeholder'))
      );
      
      return JSON.stringify(screenshots.slice(0, 10)); // Limit to 10 screenshots
    } catch (error) {
      return '[]';
    }
  }

  async extractTags(page) {
    try {
      const tags = await page.$$eval(
        '[data-hook="tag"], .tag, [class*="tag"]:not([class*="tagline"])',
        elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );
      
      return tags.join(', ');
    } catch (error) {
      return '';
    }
  }

  async extractLanguages(page) {
    const selectors = [
      '[data-hook="languages"]',
      '.languages',
      ':contains("Languages:")',
      ':contains("Available in:")'
    ];
    
    const text = await this.pageHelpers.extractText(page, selectors);
    
    // Clean up the text
    return text
      .replace(/Languages?:?/i, '')
      .replace(/Available in:?/i, '')
      .trim();
  }

  async extractLastUpdated(page) {
    const selectors = [
      '[data-hook="last-updated"]',
      '.last-updated',
      ':contains("Last updated")',
      ':contains("Updated")'
    ];
    
    const text = await this.pageHelpers.extractText(page, selectors);
    
    // Extract date pattern
    const dateMatch = text.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\w+ \d{1,2}, \d{4}/);
    return dateMatch ? dateMatch[0] : '';
  }

  async saveResults(outputPath, append = false) {
    if (this.results.length === 0) return;
    
    const writer = csvWriter({
      path: outputPath,
      header: this.config.output.headers.map(h => ({ id: h, title: h })),
      append
    });
    
    await writer.writeRecords(this.results);
    
    if (!append) {
      console.log(chalk.green(`✓ Saved ${this.results.length} apps to ${outputPath}`));
    }
  }

  async saveFailedApps() {
    if (this.failed.length === 0) return;
    
    const writer = csvWriter({
      path: this.failedFile,
      header: [
        { id: 'app_slug', title: 'app_slug' },
        { id: 'app_url', title: 'app_url' },
        { id: 'error', title: 'error' }
      ]
    });
    
    await writer.writeRecords(this.failed);
  }

  async saveProgress(lastIndex) {
    const progress = {
      lastIndex,
      timestamp: new Date().toISOString()
    };
    
    await fs.mkdir(path.dirname(this.progressFile), { recursive: true });
    await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { lastIndex: 0 };
    }
  }

  async clearProgress() {
    try {
      await fs.unlink(this.progressFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}

module.exports = AppScraper;