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
    
    // Wait for plugin cards to load
    await page.waitForSelector('article.plugin-card', { timeout: 30000 });
    
    // Extract plugin data using proper selectors from config
    const plugins = await page.$$eval('article.plugin-card', (cards) => {
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
          
          // Extract author
          const authorElement = card.querySelector('.author');
          const author = authorElement?.textContent?.replace('by', '').trim() || '';
          
          // Extract description
          const descElement = card.querySelector('.entry-excerpt');
          const description = descElement?.textContent?.trim().replace(/\s+/g, ' ') || '';
          
          // Extract rating
          const ratingElement = card.querySelector('.wporg-ratings');
          const ratingAttr = ratingElement?.getAttribute('data-rating');
          const rating = ratingAttr ? parseFloat(ratingAttr) : 0;
          
          // Extract rating count
          const ratingCountElement = card.querySelector('.rating-count a');
          const ratingCountText = ratingCountElement?.textContent || '0';
          const ratingCountMatch = ratingCountText.match(/([0-9,]+)/);
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
          
          // Extract last updated
          const updatedElement = card.querySelector('.plugin-last-updated strong');
          const lastUpdated = updatedElement?.textContent?.trim() || '';
          
          // Extract tested up to version
          const testedElement = card.querySelector('.tested-with');
          const testedText = testedElement?.textContent || '';
          const testedMatch = testedText.match(/([0-9.]+)/);
          const testedUpTo = testedMatch ? testedMatch[1] : '';
          
          // Extract icon URL
          const iconElement = card.querySelector('.plugin-icon img');
          const iconUrl = iconElement?.getAttribute('src') || '';
          
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