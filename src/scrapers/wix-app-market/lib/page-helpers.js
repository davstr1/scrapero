const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class PageHelpers {
  constructor(config) {
    this.config = config;
  }

  /**
   * Wait for content to load with multiple strategies
   */
  async waitForContent(page, options = {}) {
    const {
      selector = null,
      timeout = this.config.browser.waitForTimeout,
      waitForNetwork = true
    } = options;

    try {
      // Wait for specific selector if provided
      if (selector) {
        await page.waitForSelector(selector, { timeout });
      }

      // Wait for network to be idle
      if (waitForNetwork) {
        await page.waitForLoadState('networkidle2', { timeout: timeout / 2 });
      }

      // Additional wait for dynamic content
      await this.delay(this.config.delays.beforeExtraction);

    } catch (error) {
      console.warn(chalk.yellow('Content loading timeout, proceeding anyway...'));
    }
  }

  /**
   * Scroll page to load lazy content
   */
  async scrollToLoad(page, options = {}) {
    const {
      scrollStep = 500,
      scrollDelay = this.config.delays.afterScroll,
      maxScrolls = 10
    } = options;

    console.log(chalk.gray('Scrolling to load content...'));

    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrollCount = 0;

    while (previousHeight !== currentHeight && scrollCount < maxScrolls) {
      previousHeight = currentHeight;
      
      // Scroll down
      await page.evaluate((step) => {
        window.scrollBy(0, step);
      }, scrollStep);
      
      // Wait for content to load
      await this.delay(scrollDelay);
      
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      scrollCount++;
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log(chalk.gray(`Scrolled ${scrollCount} times`));
  }

  /**
   * Click element with retry logic
   */
  async clickElement(page, selector, options = {}) {
    const {
      timeout = 10000,
      retries = 3,
      waitAfter = this.config.delays.afterScroll
    } = options;

    for (let i = 0; i < retries; i++) {
      try {
        await page.waitForSelector(selector, { timeout });
        await page.click(selector);
        await this.delay(waitAfter);
        return true;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        console.warn(chalk.yellow(`Click failed, retrying... (${i + 1}/${retries})`));
        await this.delay(1000);
      }
    }
    return false;
  }

  /**
   * Extract text from element with fallbacks
   */
  async extractText(page, selectors, options = {}) {
    const {
      attribute = 'textContent',
      clean = true
    } = options;

    // Ensure selectors is an array
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
      try {
        const text = await page.$eval(selector, (el, attr) => {
          return el[attr] || el.innerText || el.textContent || '';
        }, attribute);

        if (text && clean) {
          return this.cleanText(text);
        }
        return text;
      } catch (error) {
        // Continue to next selector
      }
    }

    return '';
  }

  /**
   * Extract attribute from element
   */
  async extractAttribute(page, selector, attribute) {
    try {
      return await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract multiple elements
   */
  async extractMultiple(page, selector, extractor) {
    try {
      return await page.$$eval(selector, (elements, fn) => {
        return elements.map(el => {
          try {
            return new Function('el', fn)(el);
          } catch (error) {
            return null;
          }
        }).filter(Boolean);
      }, extractor.toString());
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if element exists
   */
  async elementExists(page, selector) {
    try {
      const element = await page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for navigation with timeout
   */
  async safeNavigate(page, url, options = {}) {
    const {
      timeout = this.config.browser.navigationTimeout,
      waitUntil = 'networkidle2'
    } = options;

    try {
      const response = await page.goto(url, {
        timeout,
        waitUntil
      });

      if (!response || !response.ok()) {
        throw new Error(`Navigation failed: ${response ? response.status() : 'No response'}`);
      }

      return response;
    } catch (error) {
      console.error(chalk.red(`Navigation error for ${url}:`, error.message));
      
      // Take screenshot on navigation error
      if (this.config.logging.screenshotOnError) {
        await this.takeScreenshot(page, 'navigation-error');
      }
      
      throw error;
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(page, prefix = 'screenshot') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}-${timestamp}.png`;
      const filepath = path.join('temp', 'screenshots', filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      await page.screenshot({
        path: filepath,
        fullPage: true
      });
      
      console.log(chalk.gray(`Screenshot saved: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('Failed to take screenshot:', error.message));
      return null;
    }
  }

  /**
   * Save page HTML
   */
  async saveHtml(page, prefix = 'page') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}-${timestamp}.html`;
      const filepath = path.join('temp', filename);
      
      const html = await page.content();
      await fs.writeFile(filepath, html);
      
      console.log(chalk.gray(`HTML saved: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('Failed to save HTML:', error.message));
      return null;
    }
  }

  /**
   * Clean text helper
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Delay helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Random delay with jitter
   */
  async randomDelay(min, max) {
    const delay = min + Math.random() * (max - min);
    return this.delay(delay);
  }

  /**
   * Human-like mouse movement
   */
  async humanLikeHover(page, selector) {
    try {
      const element = await page.$(selector);
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          // Move to random point within element
          const x = box.x + Math.random() * box.width;
          const y = box.y + Math.random() * box.height;
          
          await page.mouse.move(x, y, { steps: 10 });
          await this.randomDelay(100, 300);
        }
      }
    } catch (error) {
      // Ignore hover errors
    }
  }

  /**
   * Wait for any of multiple selectors
   */
  async waitForAnySelector(page, selectors, options = {}) {
    const { timeout = 30000 } = options;
    
    return Promise.race(
      selectors.map(selector => 
        page.waitForSelector(selector, { timeout })
          .then(() => selector)
          .catch(() => null)
      )
    );
  }
}

module.exports = PageHelpers;