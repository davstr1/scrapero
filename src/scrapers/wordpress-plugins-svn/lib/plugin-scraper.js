const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const csvParser = require('csv-parser');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const { HttpsProxyAgent } = require('https-proxy-agent');
const pLimit = require('p-limit');
const ProgressBar = require('progress');

class PluginScraper {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.scraping.baseUrl;
    this.selectors = config.selectors;
    this.headers = config.csv.headers;
    
    // Setup proxy
    if (config.proxy.enabled) {
      this.proxyAgent = new HttpsProxyAgent(config.proxy.url);
    }
    
    // Setup concurrency limiter
    this.limit = pLimit(config.scraping.concurrency);
    
    // Progress tracking
    this.progressFile = path.join(__dirname, '..', 'temp', 'scrape-progress.json');
    this.failedFile = path.join(__dirname, '..', 'temp', 'failed-plugins.csv');
  }

  async scrape(options) {
    const { input, output, resume = false, limit = null } = options;
    
    console.log('Starting WordPress plugin scraping...');
    console.log(`Input: ${input}`);
    console.log(`Output: ${output}`);
    
    try {
      // Load slugs from CSV
      const slugs = await this.loadSlugs(input);
      console.log(`Loaded ${slugs.length} plugin slugs`);
      
      // Apply limit if specified
      const slugsToProcess = limit ? slugs.slice(0, limit) : slugs;
      
      // Load progress if resuming
      let startIndex = 0;
      let existingData = [];
      if (resume && fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        startIndex = progress.lastIndex + 1;
        console.log(`Resuming from index: ${startIndex}`);
        
        // Load existing data if output file exists
        if (fs.existsSync(output)) {
          existingData = await this.loadExistingData(output);
        }
      }
      
      // Setup CSV writer
      const writer = this.createCSVWriter(output, existingData.length === 0);
      
      // Create progress bar
      const totalToProcess = slugsToProcess.length - startIndex;
      const progressBar = new ProgressBar('Scraping [:bar] :current/:total :percent :etas', {
        complete: '█',
        incomplete: '░',
        width: 40,
        total: totalToProcess
      });
      
      // Process plugins
      const results = [];
      const failed = [];
      let processedCount = 0;
      
      // Process in batches
      const batchSize = this.config.scraping.concurrency * 5;
      for (let i = startIndex; i < slugsToProcess.length; i += batchSize) {
        const batch = slugsToProcess.slice(i, Math.min(i + batchSize, slugsToProcess.length));
        
        const batchPromises = batch.map((slugData, index) => 
          this.limit(() => this.scrapePlugin(slugData)
            .then(result => {
              results.push(result);
              processedCount++;
              progressBar.tick();
              
              // Save progress every 100 plugins
              if (processedCount % 100 === 0) {
                this.saveProgress(i + index, results.length);
                // Write batch to CSV
                writer.writeRecords(results.splice(0, results.length));
              }
              
              return result;
            })
            .catch(error => {
              failed.push({ ...slugData, error: error.message });
              progressBar.tick();
              return null;
            })
          )
        );
        
        await Promise.all(batchPromises);
      }
      
      // Write remaining results
      if (results.length > 0) {
        await writer.writeRecords(results);
      }
      
      // Save failed plugins
      if (failed.length > 0) {
        await this.saveFailedPlugins(failed);
        console.log(`\n${failed.length} plugins failed to scrape. See: ${this.failedFile}`);
      }
      
      // Clean up progress file
      if (fs.existsSync(this.progressFile)) {
        fs.unlinkSync(this.progressFile);
      }
      
      console.log('\nScraping completed!');
      console.log(`Total processed: ${processedCount}`);
      console.log(`Output saved to: ${output}`);
      
    } catch (error) {
      console.error('Scraping failed:', error.message);
      throw error;
    }
  }

  async scrapePlugin(slugData) {
    const url = slugData.plugin_url || slugData.url;
    const maxRetries = this.config.scraping.retries;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Make request
        const response = await axios.get(url, {
          timeout: this.config.scraping.requestTimeout,
          httpAgent: this.proxyAgent,
          httpsAgent: this.proxyAgent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        // Parse HTML
        const $ = cheerio.load(response.data);
        
        // Extract data
        const slug = slugData.plugin_slug || slugData.slug;
        const data = this.extractPluginData($, url, slug);
        
        return data;
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.config.scraping.retryDelay * (attempt + 1))
        );
      }
    }
  }

  extractPluginData($, url, slug) {
    const data = {
      name: this.extractText($, this.selectors.pluginName),
      url: url,
      author: this.extractAuthor($),
      description: this.extractShortDescription($),
      rating: this.extractRating($),
      ratingCount: this.extractRatingCount($),
      rating5Star: this.extractText($, this.selectors.ratingBreakdown['5star']),
      rating4Star: this.extractText($, this.selectors.ratingBreakdown['4star']),
      rating3Star: this.extractText($, this.selectors.ratingBreakdown['3star']),
      rating2Star: this.extractText($, this.selectors.ratingBreakdown['2star']),
      rating1Star: this.extractText($, this.selectors.ratingBreakdown['1star']),
      activeInstalls: this.extractActiveInstalls($),
      lastUpdated: this.extractMetaField($, 'Last updated'),
      testedUpTo: this.extractMetaField($, 'Tested up to'),
      iconUrl: this.extractIconUrl($),
      businessModel: this.determineBusinessModel($),
      scrapedAt: new Date().toISOString(),
      version: this.extractMetaField($, 'Version'),
      lastUpdatedDays: this.calculateLastUpdatedDays($),
      downloadUrl: this.extractDownloadUrl($),
      requiresWP: this.extractMetaField($, 'WordPress version'),
      requiresPHP: this.extractMetaField($, 'PHP version'),
      supportThreadsTotal: this.extractSupportThreads($, 'total'),
      supportThreadsResolved: this.extractSupportThreads($, 'resolved'),
      tags: this.extractTags($),
      contributors: this.extractContributors($),
      homepage: this.extractHomepage($),
      extendedDescription: this.extractExtendedDescription($)
    };
    
    return data;
  }

  extractText($, selectors) {
    if (!Array.isArray(selectors)) {
      selectors = [selectors];
    }
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }
    
    return '';
  }

  extractShortDescription($) {
    // Get the first paragraph of content, but remove the "Description" heading
    const description = this.extractText($, this.selectors.shortDescription);
    
    // Remove "Description" if it's at the beginning
    const cleaned = description
      .replace(/^Description\s*/i, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take only the first sentence or up to 200 characters
    const firstSentence = cleaned.match(/^[^.!?]+[.!?]/);
    if (firstSentence) {
      return firstSentence[0].trim();
    }
    
    return cleaned.substring(0, 200).trim();
  }

  extractAuthor($) {
    // Try to find author in the byline
    const bylineText = $('.wp-block-wporg-plugin-byline').text();
    const byMatch = bylineText.match(/By\s+(.+?)(?:\s|$)/i);
    if (byMatch) {
      return byMatch[1].trim();
    }
    
    // Try the contributor section
    const contributorLink = $('.wp-block-wporg-plugin-contributors a').first().text().trim();
    if (contributorLink) {
      return contributorLink;
    }
    
    // Fallback to header
    const headerText = $('header').text();
    const headerByMatch = headerText.match(/By\s+(.+?)(?:\s|$)/i);
    if (headerByMatch) {
      return headerByMatch[1].trim();
    }
    
    return '';
  }

  extractRating($) {
    // Try multiple selectors
    const selectors = [
      '.wporg-ratings-stars__label',
      '.wporg-ratings',
      '.rating'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text();
        const match = text.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          return parseFloat(match[1]);
        }
      }
    }
    
    return 0;
  }

  extractRatingCount($) {
    const countText = this.extractText($, this.selectors.ratingCount);
    const match = countText.match(/(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  extractActiveInstalls($) {
    // Try multiple approaches to find active installations
    
    // Method 1: Look for the specific list item pattern
    let activeInstallsText = '';
    const listItems = $('li');
    
    listItems.each((i, el) => {
      const html = $(el).html();
      if (html && html.includes('Active installations')) {
        // Extract the content within <strong> tags
        const strongMatch = html.match(/Active installations\s*<strong>([^<]+)<\/strong>/i);
        if (strongMatch) {
          activeInstallsText = strongMatch[1].trim();
          return false;
        }
      }
    });
    
    // Method 2: Search in the whole page for the pattern
    if (!activeInstallsText) {
      const bodyHtml = $('body').html();
      const match = bodyHtml.match(/Active installations\s*<strong>([^<]+)<\/strong>/i);
      if (match) {
        activeInstallsText = match[1].trim();
      }
    }
    
    // Method 3: Text-based search as fallback
    if (!activeInstallsText) {
      const bodyText = $('body').text();
      const textMatch = bodyText.match(/Active installations\s+(\d+[\d,+\s]*(?:million)?)/i);
      if (textMatch) {
        activeInstallsText = textMatch[1].trim();
      }
    }
    
    // Parse the number
    if (activeInstallsText) {
      // Handle different formats: "10+", "1,000+", "10,000+", "10+ million", etc.
      const cleanText = activeInstallsText.trim();
      
      // Check for millions
      if (cleanText.toLowerCase().includes('million')) {
        const num = parseFloat(cleanText.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
        return Math.floor(num * 1000000);
      }
      
      // Remove + and commas, then parse regular numbers
      const num = cleanText.replace(/[+,]/g, '').match(/(\d+)/);
      return num ? parseInt(num[1]) : 0;
    }
    
    return 0;
  }

  extractMetaField($, fieldName) {
    // Try to find in the meta section list items
    const metaItems = $('section').last().find('li');
    let result = '';
    
    metaItems.each((i, el) => {
      const text = $(el).text();
      if (text.toLowerCase().includes(fieldName.toLowerCase())) {
        // Extract the value after the field name
        const parts = text.split(/\s+/);
        const fieldIndex = parts.findIndex(p => p.toLowerCase().includes(fieldName.toLowerCase()));
        if (fieldIndex !== -1 && fieldIndex < parts.length - 1) {
          result = parts.slice(fieldIndex + 1).join(' ').trim();
          return false; // break the loop
        }
      }
    });
    
    // Fallback to searching in the full text
    if (!result) {
      const bodyText = $('body').text();
      const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+?)(?:\\n|$)`, 'i');
      const match = bodyText.match(regex);
      result = match ? match[1].trim() : '';
    }
    
    return result;
  }

  extractIconUrl($) {
    // Try multiple selectors
    const selectors = [
      '.plugin-icon',
      'img.plugin-icon',
      '.entry-thumbnail img',
      'header img'
    ];
    
    for (const selector of selectors) {
      const img = $(selector).first();
      if (img.length) {
        return img.attr('src') || '';
      }
    }
    
    return '';
  }

  determineBusinessModel($) {
    // Check for premium/pro indicators
    const pageText = $('body').text().toLowerCase();
    const indicators = ['premium', 'pro version', 'upgrade', 'pricing', 'buy now', 'purchase'];
    
    for (const indicator of indicators) {
      if (pageText.includes(indicator)) {
        return 'commercial';
      }
    }
    
    return 'free';
  }

  calculateLastUpdatedDays($) {
    // Try to find last updated in meta section
    const metaItems = $('section').last().find('li');
    let lastUpdatedText = '';
    
    metaItems.each((i, el) => {
      const text = $(el).text();
      if (text.toLowerCase().includes('last updated')) {
        lastUpdatedText = text;
        return false;
      }
    });
    
    if (!lastUpdatedText) {
      lastUpdatedText = this.extractMetaField($, 'Last updated');
    }
    
    const match = lastUpdatedText.match(/(\d+)\s+(day|week|month|year)s?\s+ago/i);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      switch (unit) {
        case 'day': return value;
        case 'week': return value * 7;
        case 'month': return value * 30;
        case 'year': return value * 365;
      }
    }
    
    return 0;
  }

  extractDownloadUrl($) {
    const downloadLink = $('.wp-block-button__link').first();
    return downloadLink.attr('href') || '';
  }

  extractSupportThreads($, type) {
    const supportText = $('.support-threads').text();
    
    if (type === 'total') {
      const match = supportText.match(/(\d+)\s+support threads/i);
      return match ? parseInt(match[1]) : 0;
    } else {
      const match = supportText.match(/(\d+)\s+resolved/i);
      return match ? parseInt(match[1]) : 0;
    }
  }

  extractTags($) {
    const tags = [];
    
    // Try multiple selectors for tags
    const selectors = [
      '.tags a',
      '.plugin-tags a',
      '.wp-block-post-tags a',
      'a[rel="tag"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const tag = $(el).text().trim();
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        });
        break;
      }
    }
    
    return tags.join(', ');
  }

  extractContributors($) {
    const contributors = [];
    
    // Try multiple selectors
    const selectors = [
      '#contributors-list a',
      '.contributors-list a',
      '.plugin-contributors a',
      '.contributors a'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const contributor = $(el).text().trim();
          if (contributor && !contributors.includes(contributor)) {
            contributors.push(contributor);
          }
        });
        break;
      }
    }
    
    return contributors.join(', ');
  }

  extractHomepage($) {
    const homepageLink = $('.plugin-homepage').first();
    return homepageLink.attr('href') || '';
  }

  extractExtendedDescription($) {
    const description = $('.entry-content').first().text().trim();
    // Remove "Description" heading and clean up
    return description
      .replace(/^Description\s*/i, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 1000)
      .trim();
  }

  async loadSlugs(inputFile) {
    const slugs = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(inputFile)
        .pipe(csvParser())
        .on('data', (row) => {
          slugs.push(row);
        })
        .on('end', () => {
          resolve(slugs);
        })
        .on('error', reject);
    });
  }

  async loadExistingData(outputFile) {
    const data = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(outputFile)
        .pipe(csvParser())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', () => {
          resolve(data);
        })
        .on('error', () => {
          // File might not exist yet
          resolve([]);
        });
    });
  }

  createCSVWriter(outputFile, writeHeaders = true) {
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const headerConfig = this.headers.map(h => ({ id: h, title: h }));
    
    return csvWriter({
      path: outputFile,
      header: headerConfig,
      append: !writeHeaders
    });
  }

  saveProgress(lastIndex, resultsCount) {
    const progress = {
      lastIndex,
      resultsCount,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
  }

  async saveFailedPlugins(failed) {
    const writer = csvWriter({
      path: this.failedFile,
      header: [
        { id: 'slug', title: 'plugin_slug' },
        { id: 'url', title: 'plugin_url' },
        { id: 'error', title: 'error_message' }
      ]
    });
    
    await writer.writeRecords(failed);
  }
}

module.exports = PluginScraper;