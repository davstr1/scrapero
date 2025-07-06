const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const PageHelpers = require('./page-helpers');

class CategoryMapper {
  constructor(config, browserManager) {
    this.config = config;
    this.browserManager = browserManager;
    this.pageHelpers = new PageHelpers(config);
    this.categories = [];
  }

  async discoverCategories() {
    console.log(chalk.blue('🔍 Discovering Wix App Market categories...'));
    
    try {
      // Discover main categories from homepage
      const mainCategories = await this.discoverMainCategories();
      console.log(chalk.green(`✓ Found ${mainCategories.length} main categories`));
      
      // Discover subcategories for each main category
      for (const category of mainCategories) {
        console.log(chalk.gray(`Exploring ${category.name}...`));
        const subcategories = await this.discoverSubcategories(category);
        
        category.subcategories = subcategories;
        category.totalApps = subcategories.reduce((sum, sub) => sum + (sub.appCount || 0), 0);
        
        this.categories.push(category);
        console.log(chalk.green(`✓ ${category.name}: ${subcategories.length} subcategories, ~${category.totalApps} apps`));
        
        // Delay between categories
        await this.pageHelpers.delay(this.config.delays.betweenRequests);
      }
      
      return this.categories;
      
    } catch (error) {
      console.error(chalk.red('Category discovery failed:', error.message));
      throw error;
    }
  }

  async discoverMainCategories() {
    return this.browserManager.withPage(async (page) => {
      console.log(chalk.gray('Loading Wix App Market homepage...'));
      
      // Navigate to homepage
      await this.pageHelpers.safeNavigate(page, this.config.urls.base);
      await this.pageHelpers.waitForContent(page, {
        selector: 'a[href*="/category/"]',
        timeout: 30000
      });
      
      // Extract main category links
      const categories = await page.evaluate(() => {
        const categoryLinks = [];
        const seen = new Set();
        
        // Find all links that point to categories
        document.querySelectorAll('a[href*="/category/"]').forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          
          // Extract category slug from URL
          const match = href.match(/\/category\/([^\/\?]+)/);
          if (match && text && !seen.has(match[1])) {
            seen.add(match[1]);
            
            categoryLinks.push({
              name: text,
              slug: match[1],
              url: href.startsWith('http') ? href : `https://www.wix.com${href}`
            });
          }
        });
        
        return categoryLinks;
      });
      
      // Filter out duplicates and sort
      const uniqueCategories = this.deduplicateCategories(categories);
      
      return uniqueCategories;
    });
  }

  async discoverSubcategories(mainCategory) {
    return this.browserManager.withPage(async (page) => {
      // Navigate to category page
      await this.pageHelpers.safeNavigate(page, mainCategory.url);
      await this.pageHelpers.waitForContent(page, {
        timeout: 30000
      });
      
      // Scroll to load all content
      await this.pageHelpers.scrollToLoad(page);
      
      // Extract subcategories
      const subcategories = await page.evaluate((mainCategorySlug) => {
        const subcats = [];
        const sections = document.querySelectorAll('section, div[class*="category"], div[class*="section"]');
        
        sections.forEach(section => {
          // Look for section titles
          const titleElement = section.querySelector('h2, h3, div[class*="title"]');
          if (!titleElement) return;
          
          const sectionTitle = titleElement.textContent.trim();
          if (!sectionTitle) return;
          
          // Look for "View All X Apps" links in this section
          const viewAllLink = section.querySelector('a[href*="view-all"], a:contains("View All")');
          let appCount = 0;
          let viewAllUrl = null;
          
          if (viewAllLink) {
            viewAllUrl = viewAllLink.getAttribute('href');
            // Extract app count from link text
            const linkText = viewAllLink.textContent;
            const countMatch = linkText.match(/(\d+)\s*Apps?/i);
            if (countMatch) {
              appCount = parseInt(countMatch[1]);
            }
          }
          
          // Count app cards in this section
          const appCards = section.querySelectorAll('a[href*="/web-solution/"]').length;
          
          subcats.push({
            name: sectionTitle,
            slug: sectionTitle.toLowerCase().replace(/\s+/g, '-'),
            parentSlug: mainCategorySlug,
            appCount: appCount || appCards,
            viewAllUrl: viewAllUrl ? (viewAllUrl.startsWith('http') ? viewAllUrl : `https://www.wix.com${viewAllUrl}`) : null,
            hasViewAll: !!viewAllUrl
          });
        });
        
        return subcats;
      }, mainCategory.slug);
      
      // Filter out empty subcategories
      return subcategories.filter(sub => sub.appCount > 0);
    });
  }

  deduplicateCategories(categories) {
    const seen = new Map();
    
    categories.forEach(cat => {
      if (!seen.has(cat.slug) || cat.name.length > seen.get(cat.slug).name.length) {
        seen.set(cat.slug, cat);
      }
    });
    
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async saveCategories(outputPath) {
    const output = {
      discovered_at: new Date().toISOString(),
      total_categories: this.categories.length,
      total_subcategories: this.categories.reduce((sum, cat) => sum + cat.subcategories.length, 0),
      estimated_total_apps: this.categories.reduce((sum, cat) => sum + cat.totalApps, 0),
      categories: this.categories
    };
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(chalk.green(`✓ Categories saved to ${outputPath}`));
    
    // Print summary
    console.log(chalk.blue('\nCategory Summary:'));
    this.categories.forEach(cat => {
      console.log(chalk.white(`- ${cat.name}: ${cat.subcategories.length} subcategories, ~${cat.totalApps} apps`));
    });
    console.log(chalk.yellow(`\nTotal estimated apps: ${output.estimated_total_apps}`));
    
    return output;
  }

  async loadCategories(inputPath) {
    try {
      const data = await fs.readFile(inputPath, 'utf8');
      const parsed = JSON.parse(data);
      this.categories = parsed.categories || [];
      return parsed;
    } catch (error) {
      console.error(chalk.red('Failed to load categories:', error.message));
      throw error;
    }
  }

  getCategoryList() {
    const list = [];
    
    this.categories.forEach(mainCat => {
      mainCat.subcategories.forEach(subCat => {
        list.push({
          mainCategory: mainCat.name,
          mainSlug: mainCat.slug,
          subcategory: subCat.name,
          subSlug: subCat.slug,
          url: subCat.viewAllUrl || mainCat.url,
          estimatedApps: subCat.appCount,
          hasViewAll: subCat.hasViewAll
        });
      });
    });
    
    return list;
  }
}

module.exports = CategoryMapper;