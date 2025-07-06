const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class BrowserManager {
  constructor(config) {
    this.config = config;
    this.browsers = [];
    this.availableBrowsers = [];
    this.isShuttingDown = false;
  }

  async initialize(poolSize = null) {
    const size = poolSize || this.config.browser.concurrency;
    console.log(chalk.blue(`Initializing browser pool with ${size} instances...`));
    
    for (let i = 0; i < size; i++) {
      try {
        const browser = await this.createBrowser(i);
        this.browsers.push(browser);
        this.availableBrowsers.push(browser);
        console.log(chalk.green(`✓ Browser ${i + 1} initialized`));
      } catch (error) {
        console.error(chalk.red(`✗ Failed to initialize browser ${i + 1}:`, error.message));
      }
    }
    
    console.log(chalk.green(`Browser pool ready with ${this.browsers.length} instances`));
  }

  async createBrowser(id = 0) {
    const args = [...this.config.browser.args];
    
    // Add proxy if enabled
    if (this.config.proxy.enabled) {
      // Extract proxy host and port from URL
      const proxyUrl = new URL(this.config.proxy.url);
      args.push(`--proxy-server=${proxyUrl.host}`);
    }

    const browser = await puppeteer.launch({
      headless: this.config.browser.headless,
      args,
      defaultViewport: this.config.browser.viewport,
      ignoreHTTPSErrors: true
    });

    browser.id = id;
    browser.inUse = false;
    browser.requestCount = 0;

    // Set up error handling
    browser.on('disconnected', () => {
      console.log(chalk.yellow(`Browser ${id} disconnected`));
      this.handleBrowserDisconnect(browser);
    });

    return browser;
  }

  async getBrowser() {
    // Wait for available browser
    while (this.availableBrowsers.length === 0 && !this.isShuttingDown) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.isShuttingDown) {
      throw new Error('Browser manager is shutting down');
    }

    const browser = this.availableBrowsers.shift();
    browser.inUse = true;
    return browser;
  }

  releaseBrowser(browser) {
    browser.inUse = false;
    browser.requestCount++;
    
    // Restart browser after certain number of requests to prevent memory leaks
    if (browser.requestCount > 50) {
      this.restartBrowser(browser);
    } else {
      this.availableBrowsers.push(browser);
    }
  }

  async restartBrowser(browser) {
    console.log(chalk.yellow(`Restarting browser ${browser.id}...`));
    
    try {
      await browser.close();
    } catch (error) {
      console.error(chalk.red(`Error closing browser ${browser.id}:`, error.message));
    }

    try {
      const newBrowser = await this.createBrowser(browser.id);
      const index = this.browsers.findIndex(b => b.id === browser.id);
      this.browsers[index] = newBrowser;
      this.availableBrowsers.push(newBrowser);
      console.log(chalk.green(`✓ Browser ${browser.id} restarted`));
    } catch (error) {
      console.error(chalk.red(`Failed to restart browser ${browser.id}:`, error.message));
    }
  }

  handleBrowserDisconnect(browser) {
    const index = this.browsers.findIndex(b => b.id === browser.id);
    if (index !== -1 && !this.isShuttingDown) {
      this.restartBrowser(browser);
    }
  }

  async createPage(browser) {
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent(this.getRandomUserAgent());
    
    // Set viewport with slight randomization
    const viewport = this.getRandomViewport();
    await page.setViewport(viewport);
    
    // Set proxy authentication if needed
    if (this.config.proxy.enabled) {
      const proxyUrl = new URL(this.config.proxy.url);
      if (proxyUrl.username && proxyUrl.password) {
        await page.authenticate({
          username: proxyUrl.username,
          password: proxyUrl.password
        });
      }
    }

    // Add request interception for monitoring
    await page.setRequestInterception(true);
    page.on('request', request => {
      // Block unnecessary resources to speed up loading
      const blockedResourceTypes = ['font', 'media'];
      if (blockedResourceTypes.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Set navigation timeout
    page.setDefaultNavigationTimeout(this.config.browser.navigationTimeout);
    page.setDefaultTimeout(this.config.browser.pageTimeout);

    return page;
  }

  getRandomUserAgent() {
    const userAgents = [
      this.config.scraper.userAgent,
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  getRandomViewport() {
    const baseViewport = this.config.browser.viewport;
    
    // Add slight randomization
    return {
      width: baseViewport.width + Math.floor(Math.random() * 100) - 50,
      height: baseViewport.height + Math.floor(Math.random() * 100) - 50
    };
  }

  getProxyUrl() {
    // For now, return the single proxy URL
    // In future, could implement rotation here
    return this.config.proxy.url;
  }

  async shutdown() {
    console.log(chalk.yellow('Shutting down browser pool...'));
    this.isShuttingDown = true;
    
    for (const browser of this.browsers) {
      try {
        await browser.close();
        console.log(chalk.green(`✓ Browser ${browser.id} closed`));
      } catch (error) {
        console.error(chalk.red(`Error closing browser ${browser.id}:`, error.message));
      }
    }
    
    this.browsers = [];
    this.availableBrowsers = [];
    console.log(chalk.green('Browser pool shutdown complete'));
  }

  async withPage(fn) {
    let browser = null;
    let page = null;
    
    try {
      browser = await this.getBrowser();
      page = await this.createPage(browser);
      
      const result = await fn(page);
      
      await page.close();
      this.releaseBrowser(browser);
      
      return result;
    } catch (error) {
      if (page) {
        try {
          // Take screenshot on error if configured
          if (this.config.logging.screenshotOnError) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            await page.screenshot({ 
              path: `temp/screenshots/error-${timestamp}.png`,
              fullPage: true 
            });
          }
          
          // Save HTML on error if configured
          if (this.config.logging.saveHtmlOnError) {
            const html = await page.content();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fs = require('fs').promises;
            await fs.writeFile(`temp/error-${timestamp}.html`, html);
          }
          
          await page.close();
        } catch (cleanupError) {
          console.error(chalk.red('Error during cleanup:', cleanupError.message));
        }
      }
      
      if (browser) {
        this.releaseBrowser(browser);
      }
      
      throw error;
    }
  }
}

module.exports = BrowserManager;