const cheerio = require('cheerio');
const HttpClient = require('./http-client');
const Utils = require('./utils');
const config = require('../config.json');

class UrlDiscovery {
  constructor() {
    this.httpClient = new HttpClient();
    this.baseUrl = config.scraping.baseUrl;
    this.discoveredUrls = {
      categories: [],
      subcategories: [],
      apps: [],
      timestamp: Utils.getTimestamp()
    };
  }

  async discoverAll() {
    console.log('Starting URL discovery...');
    
    // Step 1: Get main categories from homepage
    await this.discoverMainCategories();
    
    // Step 2: For each category, get subcategories
    await this.discoverSubcategories();
    
    // Step 3: Extract app URLs from all pages
    await this.discoverAppUrls();
    
    // Save results
    await Utils.writeJsonFile(config.output.urlsFile, this.discoveredUrls);
    
    console.log('\nDiscovery Summary:');
    console.log(`- Categories: ${this.discoveredUrls.categories.length}`);
    console.log(`- Subcategories: ${this.discoveredUrls.subcategories.length}`);
    console.log(`- Apps: ${this.discoveredUrls.apps.length}`);
    
    return this.discoveredUrls;
  }

  prettifySlug(slug) {
    return slug
      .replace(/--/g, ' & ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  async discoverMainCategories() {
    console.log('\nDiscovering main categories...');
    
    const response = await this.httpClient.get(this.baseUrl);
    const $ = cheerio.load(response.data);
    
    // Look for category links in navigation
    const categoryLinks = new Set();
    
    // Pattern 1: Direct category links
    $('a[href*="/app-market/category/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('referral')) {
        const match = href.match(/\/category\/([^/?]+)/);
        if (match && match[1]) {
          const categorySlug = match[1];
          // Get clean category name - only direct text, not all descendants
          let categoryName = '';
          const directText = $(el).contents().filter(function() {
            return this.nodeType === 3; // Text nodes only
          }).text().trim();
          
          if (directText) {
            categoryName = directText;
          } else {
            // Try first text element
            categoryName = $(el).find('span, div').first().text().trim() || categorySlug;
          }
          
          // Clean up the name
          categoryName = categoryName.split('\n')[0].trim();
          
          if (!categorySlug.includes('/') && categoryName.length < 50) { // Main category only
            categoryLinks.add(JSON.stringify({
              name: categoryName || this.prettifySlug(categorySlug),
              slug: categorySlug,
              url: `${this.baseUrl}/category/${categorySlug}`
            }));
          }
        }
      }
    });
    
    // Pattern 2: Look for navigation menu items
    $('nav a, [role="navigation"] a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && href.includes('/category/') && text) {
        const match = href.match(/\/category\/([^/?]+)/);
        if (match && match[1]) {
          categoryLinks.add(JSON.stringify({
            name: text,
            slug: match[1],
            url: `${this.baseUrl}/category/${match[1]}`
          }));
        }
      }
    });
    
    // Convert Set back to array
    this.discoveredUrls.categories = Array.from(categoryLinks).map(item => JSON.parse(item));
    
    // Add known categories as fallback
    const knownCategories = [
      { name: 'Marketing', slug: 'marketing' },
      { name: 'Sell Online', slug: 'ecommerce' },
      { name: 'Services & Events', slug: 'booking--events' },
      { name: 'Communication', slug: 'communication' },
      { name: 'Design Elements', slug: 'design-elements' },
      { name: 'Media & Content', slug: 'media--content' }
    ];
    
    for (const known of knownCategories) {
      if (!this.discoveredUrls.categories.find(c => c.slug === known.slug)) {
        this.discoveredUrls.categories.push({
          ...known,
          url: `${this.baseUrl}/category/${known.slug}`
        });
      }
    }
    
    console.log(`Found ${this.discoveredUrls.categories.length} categories`);
  }

  async discoverSubcategories() {
    console.log('\nDiscovering subcategories...');
    
    for (const category of this.discoveredUrls.categories) {
      console.log(`\nProcessing category: ${category.name}`);
      
      try {
        const response = await this.httpClient.get(category.url);
        const $ = cheerio.load(response.data);
        
        const subcategoryLinks = new Set();
        
        // Look for subcategory patterns
        // Pattern 1: Links with full subcategory path
        $(`a[href*="/category/${category.slug}/"]`).each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          
          if (href && text) {
            const match = href.match(/\/category\/[^/]+\/([^/?]+)/);
            if (match && match[1]) {
              subcategoryLinks.add(JSON.stringify({
                name: text,
                slug: match[1],
                parentCategory: category.slug,
                url: `${this.baseUrl}/category/${category.slug}/${match[1]}`
              }));
            }
          }
        });
        
        // Pattern 2: Section headers with "View All" links
        $('section').each((i, section) => {
          const $section = $(section);
          const heading = $section.find('h2, h3').first().text().trim();
          const viewAllLink = $section.find('a:contains("View All"), a:contains("apps")').attr('href');
          
          if (heading && viewAllLink && viewAllLink.includes('/category/')) {
            const match = viewAllLink.match(/\/category\/[^/]+\/([^/?]+)/);
            if (match && match[1]) {
              subcategoryLinks.add(JSON.stringify({
                name: heading,
                slug: match[1],
                parentCategory: category.slug,
                url: `${this.baseUrl}/category/${category.slug}/${match[1]}`
              }));
            }
          }
        });
        
        // Add discovered subcategories
        const newSubcategories = Array.from(subcategoryLinks).map(item => JSON.parse(item));
        this.discoveredUrls.subcategories.push(...newSubcategories);
        
        console.log(`  Found ${newSubcategories.length} subcategories`);
        
      } catch (error) {
        console.error(`Error processing category ${category.name}:`, error.message);
      }
    }
    
    // Remove duplicates
    this.discoveredUrls.subcategories = Utils.removeDuplicates(
      this.discoveredUrls.subcategories,
      sub => sub.url
    );
  }

  async discoverAppUrls() {
    console.log('\nDiscovering app URLs...');
    
    // Collect from all category and subcategory pages
    const allPages = [
      ...this.discoveredUrls.categories,
      ...this.discoveredUrls.subcategories
    ];
    
    for (const page of allPages) {
      console.log(`\nProcessing: ${page.name}`);
      
      try {
        const response = await this.httpClient.get(page.url);
        const $ = cheerio.load(response.data);
        
        const appLinks = new Set();
        
        // Pattern: Links to /web-solution/
        $('a[href*="/web-solution/"]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            const match = href.match(/\/web-solution\/([^/?]+)/);
            if (match && match[1]) {
              const appSlug = match[1];
              
              // Try to get app name from various sources
              let appName = '';
              const $el = $(el);
              
              // Try image alt text
              const imgAlt = $el.find('img').attr('alt');
              if (imgAlt) {
                appName = imgAlt;
              } else {
                // Try text content
                const text = $el.text().trim();
                if (text && text.length < 100) { // Avoid long descriptions
                  appName = text;
                }
              }
              
              appLinks.add(JSON.stringify({
                slug: appSlug,
                name: appName || appSlug,
                url: `${this.baseUrl}/web-solution/${appSlug}`,
                category: page.parentCategory || page.slug,
                discoveredFrom: page.url
              }));
            }
          }
        });
        
        const newApps = Array.from(appLinks).map(item => JSON.parse(item));
        this.discoveredUrls.apps.push(...newApps);
        
        console.log(`  Found ${newApps.length} apps`);
        
        // Limit apps per category if configured
        if (config.scraping.maxAppsPerCategory && newApps.length >= config.scraping.maxAppsPerCategory) {
          console.log(`  Reached max apps limit (${config.scraping.maxAppsPerCategory})`);
        }
        
      } catch (error) {
        console.error(`Error processing ${page.name}:`, error.message);
      }
    }
    
    // Remove duplicate apps
    this.discoveredUrls.apps = Utils.removeDuplicates(
      this.discoveredUrls.apps,
      app => app.slug
    );
  }

  async loadExistingUrls() {
    const existing = await Utils.readJsonFile(config.output.urlsFile);
    if (existing) {
      this.discoveredUrls = existing;
      console.log('Loaded existing URLs:');
      console.log(`- Categories: ${existing.categories.length}`);
      console.log(`- Subcategories: ${existing.subcategories.length}`);
      console.log(`- Apps: ${existing.apps.length}`);
    }
    return existing;
  }
}

module.exports = UrlDiscovery;