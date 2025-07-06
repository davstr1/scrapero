const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');
const { createReadStream } = require('fs');
const PageHelpers = require('./page-helpers');
const ProgressBar = require('progress');

class UrlCollector {
  constructor(config, browserManager) {
    this.config = config;
    this.browserManager = browserManager;
    this.pageHelpers = new PageHelpers(config);
    this.collectedUrls = new Map();
    this.progressFile = path.join('temp', 'url-collection-progress.json');
  }

  async collectAllUrls(categories, outputPath, options = {}) {
    const { resume = false } = options;
    
    console.log(chalk.blue('🔗 Collecting app URLs from all categories...'));
    
    // Load existing progress if resuming
    let startIndex = 0;
    if (resume) {
      const progress = await this.loadProgress();
      startIndex = progress.lastCategoryIndex || 0;
      this.collectedUrls = new Map(progress.collectedUrls || []);
      console.log(chalk.yellow(`Resuming from category index ${startIndex}`));
    }
    
    // Create progress bar
    const progressBar = new ProgressBar('Collecting [:bar] :current/:total categories :percent :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total: categories.length
    });
    
    // Skip already processed categories
    if (startIndex > 0) {
      progressBar.tick(startIndex);
    }
    
    // Process each category
    for (let i = startIndex; i < categories.length; i++) {
      const category = categories[i];
      
      try {
        console.log(chalk.gray(`\nProcessing ${category.mainCategory} > ${category.subcategory}...`));
        
        const urls = await this.collectCategoryUrls(category);
        
        // Add to collected URLs
        urls.forEach(urlData => {
          if (!this.collectedUrls.has(urlData.slug)) {
            this.collectedUrls.set(urlData.slug, urlData);
          }
        });
        
        console.log(chalk.green(`✓ Collected ${urls.length} apps`));
        
        // Save progress
        await this.saveProgress(i + 1);
        
        // Update progress bar
        progressBar.tick();
        
        // Delay between categories
        await this.pageHelpers.delay(this.config.delays.betweenRequests);
        
      } catch (error) {
        console.error(chalk.red(`✗ Failed to collect URLs for ${category.subcategory}:`, error.message));
        // Continue with next category
      }
    }
    
    // Save all collected URLs
    await this.saveUrls(outputPath);
    
    // Clean up progress file
    await this.clearProgress();
    
    console.log(chalk.green(`\n✓ URL collection complete! Total unique apps: ${this.collectedUrls.size}`));
    
    return Array.from(this.collectedUrls.values());
  }

  async collectCategoryUrls(category) {
    return this.browserManager.withPage(async (page) => {
      const urls = [];
      
      // Navigate to category page
      await this.pageHelpers.safeNavigate(page, category.url);
      await this.pageHelpers.waitForContent(page, {
        timeout: 30000
      });
      
      // If there's a "View All" button, click it
      if (category.hasViewAll) {
        try {
          const viewAllClicked = await this.clickViewAll(page);
          if (viewAllClicked) {
            console.log(chalk.gray('Clicked "View All" button'));
            await this.pageHelpers.waitForContent(page, {
              timeout: 20000
            });
          }
        } catch (error) {
          console.warn(chalk.yellow('Could not click View All button'));
        }
      }
      
      // Load all apps (handle infinite scroll)
      await this.loadAllApps(page);
      
      // Extract app URLs
      const appData = await page.evaluate(() => {
        const apps = [];
        const seen = new Set();
        
        // Find all app links
        document.querySelectorAll('a[href*="/web-solution/"]').forEach(link => {
          const href = link.getAttribute('href');
          const match = href.match(/\/web-solution\/([^\/\?]+)/);
          
          if (match && !seen.has(match[1])) {
            seen.add(match[1]);
            
            // Try to get app name from various possible locations
            let appName = '';
            
            // Try parent element
            const parent = link.closest('[data-hook="app-card"], div[class*="app"], article');
            if (parent) {
              const nameEl = parent.querySelector('h3, h4, [class*="name"], [class*="title"]');
              if (nameEl) {
                appName = nameEl.textContent.trim();
              }
            }
            
            // Fallback to link text
            if (!appName) {
              appName = link.textContent.trim();
            }
            
            // Get other metadata if available
            let rating = null;
            let installs = null;
            
            if (parent) {
              const ratingEl = parent.querySelector('[class*="rating"], [data-hook="rating"]');
              if (ratingEl) {
                const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
                if (ratingMatch) {
                  rating = parseFloat(ratingMatch[1]);
                }
              }
              
              const installEl = parent.querySelector('[class*="install"], [class*="user"]');
              if (installEl) {
                installs = installEl.textContent.trim();
              }
            }
            
            apps.push({
              slug: match[1],
              url: href.startsWith('http') ? href : `https://www.wix.com${href}`,
              name: appName,
              rating: rating,
              installs: installs
            });
          }
        });
        
        return apps;
      });
      
      // Add category info to each app
      return appData.map(app => ({
        ...app,
        mainCategory: category.mainCategory,
        mainSlug: category.mainSlug,
        subcategory: category.subcategory,
        subSlug: category.subSlug,
        collectedAt: new Date().toISOString()
      }));
    });
  }

  async clickViewAll(page) {
    const viewAllSelectors = [
      'a[href*="view-all"]',
      'button:contains("View All")',
      'a:contains("View All")',
      '[class*="view-all"]'
    ];
    
    for (const selector of viewAllSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          return true;
        }
      } catch (error) {
        // Try next selector
      }
    }
    
    return false;
  }

  async loadAllApps(page) {
    console.log(chalk.gray('Loading all apps...'));
    
    let previousCount = 0;
    let currentCount = 0;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      previousCount = currentCount;
      
      // Scroll to bottom
      await this.pageHelpers.scrollToLoad(page, {
        maxScrolls: 5
      });
      
      // Check for "Load More" button
      const loadMoreClicked = await this.clickLoadMore(page);
      if (loadMoreClicked) {
        console.log(chalk.gray('Clicked "Load More" button'));
        await this.pageHelpers.waitForContent(page, {
          waitForNetwork: true,
          timeout: 10000
        });
      }
      
      // Count current apps
      currentCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href*="/web-solution/"]').length;
      });
      
      console.log(chalk.gray(`Apps loaded: ${currentCount}`));
      attempts++;
      
    } while (currentCount > previousCount && attempts < maxAttempts);
    
    console.log(chalk.gray(`Finished loading. Total apps: ${currentCount}`));
  }

  async clickLoadMore(page) {
    const loadMoreSelectors = [
      'button:contains("Load More")',
      'button:contains("Show More")',
      '[class*="load-more"]',
      '[data-hook="load-more"]'
    ];
    
    for (const selector of loadMoreSelectors) {
      if (await this.pageHelpers.elementExists(page, selector)) {
        try {
          await this.pageHelpers.clickElement(page, selector, {
            waitAfter: 2000
          });
          return true;
        } catch (error) {
          // Try next selector
        }
      }
    }
    
    return false;
  }

  async saveUrls(outputPath) {
    const urls = Array.from(this.collectedUrls.values());
    
    // Create CSV writer
    const writer = csvWriter({
      path: outputPath,
      header: [
        { id: 'slug', title: 'app_slug' },
        { id: 'url', title: 'app_url' },
        { id: 'name', title: 'app_name' },
        { id: 'mainCategory', title: 'main_category' },
        { id: 'subcategory', title: 'subcategory' },
        { id: 'rating', title: 'rating_preview' },
        { id: 'installs', title: 'installs_preview' },
        { id: 'collectedAt', title: 'collected_at' },
        { id: 'scrapeStatus', title: 'scrape_status' }
      ]
    });
    
    // Add scrape status
    const urlsWithStatus = urls.map(url => ({
      ...url,
      scrapeStatus: 'pending'
    }));
    
    await writer.writeRecords(urlsWithStatus);
    console.log(chalk.green(`✓ Saved ${urls.length} URLs to ${outputPath}`));
  }

  async saveProgress(lastCategoryIndex) {
    const progress = {
      lastCategoryIndex,
      collectedUrls: Array.from(this.collectedUrls.entries()),
      timestamp: new Date().toISOString()
    };
    
    await fs.mkdir(path.dirname(this.progressFile), { recursive: true });
    await fs.writeFile(this.progressFile, JSON.stringify(progress));
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        lastCategoryIndex: 0,
        collectedUrls: []
      };
    }
  }

  async clearProgress() {
    try {
      await fs.unlink(this.progressFile);
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  }

  async loadUrlsFromCsv(csvPath) {
    const urls = [];
    
    return new Promise((resolve, reject) => {
      createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row) => {
          urls.push(row);
        })
        .on('end', () => {
          console.log(chalk.green(`✓ Loaded ${urls.length} URLs from ${csvPath}`));
          resolve(urls);
        })
        .on('error', reject);
    });
  }
}

module.exports = UrlCollector;