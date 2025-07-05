import { BaseScraper } from '../base/BaseScraper';

export default class WordpressPluginsScraper extends BaseScraper {
  constructor() {
    super('./src/scrapers/wordpress-plugins/config.json');
  }

  setupHandlers(): Record<string, Function> {
    return {
      // Custom handlers if needed
    };
  }

  async extractData(context: any): Promise<any> {
    const { page, request } = context;
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the commercial plugins page
    const url = page.url();
    if (!url.includes('plugin_business_model=commercial')) {
      // Navigate to commercial plugins page
      await page.goto('https://wordpress.org/plugins/?plugin_business_model=commercial');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for page to stabilize and debug
    await page.waitForTimeout(3000);
    
    // Debug: Log the page URL and content
    console.log('Current URL:', page.url());
    
    // Try multiple possible selectors
    const selectors = [
      'article.plugin-card',
      '.plugin-card',
      'article.type-plugin',
      '.plugin-section'
    ];
    
    let foundSelector = null;
    for (const selector of selectors) {
      const count = await page.$$eval(selector, els => els.length);
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        foundSelector = selector;
        break;
      }
    }
    
    if (!foundSelector) {
      console.log('No plugin cards found. Page HTML preview:');
      const bodyText = await page.$eval('body', el => el.innerText.slice(0, 500));
      console.log(bodyText);
      throw new Error('No plugin cards found on page');
    }
    
    // Extract plugin data using the found selector
    const plugins = await page.$$eval(foundSelector, (cards) => {
      const pluginData: any[] = [];
      
      cards.forEach((card) => {
        try {
          // Extract plugin name and URL
          const nameElement = card.querySelector('h3.entry-title a');
          if (!nameElement) return;
          
          const name = nameElement.textContent?.trim() || '';
          const url = nameElement.getAttribute('href') || '';
          
          // Skip if no name or URL
          if (!name || !url) return;
          
          // Extract author - the text is in a span inside .plugin-author
          const authorElement = card.querySelector('.plugin-author span');
          const author = authorElement?.textContent?.trim() || '';
          
          // Extract description
          const descElement = card.querySelector('.entry-excerpt');
          const description = descElement?.textContent?.trim().replace(/\s+/g, ' ') || '';
          
          // Extract rating
          const ratingElement = card.querySelector('.wporg-ratings');
          const ratingAttr = ratingElement?.getAttribute('data-rating');
          const rating = ratingAttr ? parseFloat(ratingAttr) : 0;
          
          // Extract rating count - it's directly in .rating-count
          const ratingCountElement = card.querySelector('.rating-count');
          const ratingCountText = ratingCountElement?.textContent || '0';
          // Extract number from text like "(7,067 total ratings)"
          const ratingCountMatch = ratingCountText.match(/\(([0-9,]+)/); // Note: removed closing paren from regex
          const ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[1].replace(/,/g, '')) : 0;
          
          // Extract active installations
          const installsElement = card.querySelector('.active-installs');
          const installsText = installsElement?.textContent || '';
          let activeInstalls = 0;
          
          if (installsText.includes('million')) {
            const millionMatch = installsText.match(/([0-9]+)\+?\s*million/i);
            if (millionMatch) {
              activeInstalls = parseInt(millionMatch[1]) * 1000000;
            }
          } else {
            const normalMatch = installsText.match(/([0-9,]+)\+?\s*active/i);
            if (normalMatch) {
              activeInstalls = parseInt(normalMatch[1].replace(/,/g, ''));
            }
          }
          
          // Extract last updated - try multiple selectors
          let lastUpdated = '';
          const updatedSelectors = ['.plugin-last-updated strong', '.last-updated strong', '.updated strong'];
          for (const selector of updatedSelectors) {
            const updatedElement = card.querySelector(selector);
            if (updatedElement?.textContent) {
              lastUpdated = updatedElement.textContent.trim();
              break;
            }
          }
          
          // Extract tested up to version
          const testedElement = card.querySelector('.tested-with');
          const testedText = testedElement?.textContent || '';
          const testedMatch = testedText.match(/([0-9.]+)/);
          const testedUpTo = testedMatch ? testedMatch[1] : '';
          
          // Extract icon URL - try multiple selectors
          let iconUrl = '';
          const iconSelectors = ['.plugin-icon img', '.entry-thumbnail img', 'img.plugin-icon'];
          for (const selector of iconSelectors) {
            const iconElement = card.querySelector(selector);
            if (iconElement) {
              iconUrl = iconElement.getAttribute('src') || iconElement.getAttribute('data-src') || '';
              if (iconUrl) break;
            }
          }
          
          pluginData.push({
            name: name,
            url: url.startsWith('http') ? url : `https://wordpress.org${url}`,
            author: author,
            description: description,
            rating: rating,
            ratingCount: ratingCount,
            activeInstalls: activeInstalls,
            lastUpdated: lastUpdated,
            testedUpTo: testedUpTo,
            iconUrl: iconUrl,
            businessModel: 'commercial',
            scrapedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error extracting plugin data:', error);
        }
      });
      
      return pluginData;
    });

    console.log(`Extracted ${plugins.length} plugins from current page`);
    
    // Handle pagination
    const hasNextPage = await page.$('.pagination-links a.next:not(.disabled)');
    if (hasNextPage && context.request.userData?.pageNumber < 2) {
      const nextPageUrl = await page.$eval('.pagination-links a.next', (el) => el.getAttribute('href'));
      if (nextPageUrl) {
        await context.enqueueRequest({
          url: nextPageUrl.startsWith('http') ? nextPageUrl : `https://wordpress.org${nextPageUrl}`,
          userData: { pageNumber: (context.request.userData?.pageNumber || 1) + 1 }
        });
      }
    }

    return plugins;
  }
}