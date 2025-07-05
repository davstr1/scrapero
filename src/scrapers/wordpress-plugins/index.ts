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
    
    // Extract plugin data using a simpler approach
    const plugins = await page.$$eval('a[href*="/plugins/"]', (links) => {
      const pluginData: any[] = [];
      const processedUrls = new Set<string>();
      
      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || !href.includes('/plugins/') || href === '/plugins/' || processedUrls.has(href)) {
          return;
        }
        
        processedUrls.add(href);
        
        // Find the container that holds this plugin's info
        let container = link.parentElement;
        while (container && container.parentElement) {
          // Look for a container that has multiple relevant elements
          const hasImage = container.querySelector('img');
          const hasText = container.textContent && container.textContent.length > 50;
          if (hasImage && hasText) {
            break;
          }
          container = container.parentElement;
        }
        
        if (!container) return;
        
        // Extract data from container
        const title = link.textContent?.trim() || '';
        
        // Skip navigation links
        if (!title || title === 'Plugin Directory' || title.length < 3) return;
        
        // Extract all text content
        const allText = container.textContent || '';
        
        // Extract rating count
        let ratingCount = 0;
        const ratingMatch = allText.match(/\(([0-9,]+)\)/);
        if (ratingMatch) {
          ratingCount = parseInt(ratingMatch[1].replace(/,/g, ''));
        }
        
        // Extract active installations
        let activeInstalls = 0;
        const installMatch = allText.match(/([0-9]+)\+?\s*million\s*active\s*installation/i);
        if (installMatch) {
          activeInstalls = parseInt(installMatch[1]) * 1000000;
        } else {
          const simpleMatch = allText.match(/([0-9,]+)\+?\s*active\s*installation/i);
          if (simpleMatch) {
            activeInstalls = parseInt(simpleMatch[1].replace(/,/g, ''));
          }
        }
        
        // Extract tested version
        let testedUpTo = '';
        const testedMatch = allText.match(/Tested\s+with\s+(\d+\.\d+(?:\.\d+)?)/i);
        if (testedMatch) {
          testedUpTo = testedMatch[1];
        }
        
        // Extract author - look for known authors or pattern
        let author = '';
        const authorPatterns = ['Elementor', 'Yoast', 'Automattic', 'ServMask', 'WooCommerce', 'WPMU DEV'];
        for (const pattern of authorPatterns) {
          if (allText.includes(pattern)) {
            author = pattern;
            break;
          }
        }
        
        // Extract description - find a long text that's not the title
        let description = '';
        const textNodes = container.querySelectorAll('p, div');
        textNodes.forEach((node) => {
          const text = node.textContent?.trim() || '';
          if (text.length > 50 && text !== title && !text.includes('Tested with')) {
            description = text;
          }
        });
        
        // Extract icon
        const iconElement = container.querySelector('img');
        const iconUrl = iconElement ? iconElement.getAttribute('src') || '' : '';
        
        // Extract rating (count stars)
        let rating = 0;
        const starElements = container.querySelectorAll('[class*="star"]');
        starElements.forEach((star) => {
          if (star.className.includes('star-filled')) {
            rating += 1;
          } else if (star.className.includes('star-half')) {
            rating += 0.5;
          }
        });
        
        pluginData.push({
          name: title,
          url: href.startsWith('http') ? href : `https://wordpress.org${href}`,
          author: author,
          description: description,
          rating: rating,
          ratingCount: ratingCount,
          activeInstalls: activeInstalls,
          lastUpdated: '', // Not visible in this view
          testedUpTo: testedUpTo,
          iconUrl: iconUrl,
          businessModel: 'commercial',
          scrapedAt: new Date().toISOString()
        });
      });
      
      return pluginData;
    });

    console.log(`Extracted ${plugins.length} plugins`);
    if (plugins.length > 0) {
      console.log('Sample plugin:', plugins[0]);
      plugins.forEach((plugin, i) => {
        console.log(`Plugin ${i + 1}: ${plugin.name} - Tested with: ${plugin.testedUpTo} - Installs: ${plugin.activeInstalls}`);
      });
    }

    return plugins;
  }
}