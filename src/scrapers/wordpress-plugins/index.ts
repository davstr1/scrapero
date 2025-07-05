import { BaseScraper } from '../base/BaseScraper';

export default class WordpressPluginsScraper extends BaseScraper {
  private processedCount = 0;

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
    
    // Check if this is a detail page request
    if (context.request.userData?.isDetailPage) {
      return this.extractDetailPageData(context);
    } else {
      return this.extractListingPageData(context);
    }
  }

  private async extractListingPageData(context: any): Promise<any> {
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
    
    // Enqueue detail pages for each plugin
    const detailRequests = plugins.map(plugin => {
      const slug = plugin.url.split('/').filter(Boolean).pop();
      return {
        url: plugin.url,
        userData: {
          isDetailPage: true,
          pluginSlug: slug,
          listingData: plugin
        }
      };
    });
    
    await context.addRequests(detailRequests);
    
    // Handle pagination
    const hasNextPage = await page.$('.pagination-links a.next:not(.disabled)');
    if (hasNextPage && context.request.userData?.pageNumber < 2) {
      const nextPageUrl = await page.$eval('.pagination-links a.next', (el) => el.getAttribute('href'));
      if (nextPageUrl) {
        await context.addRequests([{
          url: nextPageUrl.startsWith('http') ? nextPageUrl : `https://wordpress.org${nextPageUrl}`,
          userData: { pageNumber: (context.request.userData?.pageNumber || 1) + 1 }
        }]);
      }
    }

    // Don't return listing data - it will be enriched and returned from detail pages
    return [];
  }

  private async extractDetailPageData(context: any): Promise<any> {
    this.processedCount++;
    const timestamp = new Date().toISOString();
    const memory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    console.log(`[${timestamp}] Processing detail page ${this.processedCount}: ${context.request.userData.pluginSlug} (Memory: ${memory.toFixed(2)}MB)`);
    
    const { page, request } = context;
    const { listingData } = request.userData;
    
    try {
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Extract all detail fields
      const version = await this.extractVersion(page);
      const lastUpdated = await this.extractLastUpdated(page);
      const lastUpdatedDays = this.calculateDaysSinceUpdate(lastUpdated);
      const downloadUrl = await this.extractDownloadUrl(page);
      const requiresWP = await this.extractWPVersion(page);
      const requiresPHP = await this.extractPHPVersion(page);
      const supportStats = await this.extractSupportStats(page);
      const tags = await this.extractTags(page);
      const contributors = await this.extractContributors(page);
      const homepage = await this.extractHomepage(page);
      const extendedDescription = await this.extractExtendedDescription(page);
      
      // Merge with listing data
      const detailData = {
        version,
        lastUpdated,
        lastUpdatedDays,
        downloadUrl,
        requiresWP,
        requiresPHP,
        supportThreadsTotal: supportStats.totalThreads || 0,
        supportThreadsResolved: supportStats.resolvedThreads || 0,
        tags,
        contributors,
        homepage,
        extendedDescription
      };
      
      return { ...listingData, ...detailData };
    } catch (error) {
      console.error('Failed to extract detail data:', error);
      return listingData;
    }
  }

  private async extractVersion(page: any): Promise<string> {
    try {
      const versionText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
        const versionLi = els.find(el => el.textContent?.includes('Version'));
        return versionLi?.textContent || '';
      });
      return versionText.replace('Version', '').trim();
    } catch (error) {
      return '';
    }
  }

  private async extractLastUpdated(page: any): Promise<string> {
    try {
      const updatedText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
        const updatedLi = els.find(el => el.textContent?.includes('Last updated'));
        return updatedLi?.textContent || '';
      });
      return updatedText.replace('Last updated', '').trim();
    } catch (error) {
      return '';
    }
  }

  private calculateDaysSinceUpdate(lastUpdatedText: string): number {
    const match = lastUpdatedText.match(/(\d+)\s+days?\s+ago/);
    if (match) return parseInt(match[1]);
    
    const weeksMatch = lastUpdatedText.match(/(\d+)\s+weeks?\s+ago/);
    if (weeksMatch) return parseInt(weeksMatch[1]) * 7;
    
    return 0;
  }

  private async extractDownloadUrl(page: any): Promise<string> {
    try {
      const downloadLink = await page.$eval('.plugin-download a.button', (el: any) => el.getAttribute('href'));
      return downloadLink || '';
    } catch (error) {
      return '';
    }
  }

  private async extractWPVersion(page: any): Promise<string> {
    try {
      const wpText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
        const wpLi = els.find(el => el.textContent?.includes('Requires WordPress Version'));
        return wpLi?.textContent || '';
      });
      const match = wpText.match(/[\d.]+/);
      return match ? match[0] : '';
    } catch (error) {
      return '';
    }
  }

  private async extractPHPVersion(page: any): Promise<string> {
    try {
      const phpText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
        const phpLi = els.find(el => el.textContent?.includes('Requires PHP Version'));
        return phpLi?.textContent || '';
      });
      const match = phpText.match(/[\d.]+/);
      return match ? match[0] : '';
    } catch (error) {
      return '';
    }
  }

  private async extractSupportStats(page: any): Promise<any> {
    try {
      const stats = await page.$$eval('.widget ul li', (els: any[]) => {
        const result: any = {};
        els.forEach(el => {
          const text = el.textContent || '';
          if (text.includes('Support threads')) {
            const match = text.match(/(\d+)/);
            result.totalThreads = match ? parseInt(match[1]) : 0;
          }
          if (text.includes('resolved in the last')) {
            const match = text.match(/(\d+)/);
            result.resolvedThreads = match ? parseInt(match[1]) : 0;
          }
        });
        return result;
      });
      return stats;
    } catch (error) {
      return { totalThreads: 0, resolvedThreads: 0 };
    }
  }

  private async extractTags(page: any): Promise<string> {
    try {
      const tags = await page.$$eval('.widget.entry-meta .tags a', (els: any[]) => 
        els.map(el => el.textContent?.trim())
      );
      return tags.filter(Boolean).join(', ');
    } catch (error) {
      return '';
    }
  }

  private async extractContributors(page: any): Promise<string> {
    try {
      const contributors = await page.$$eval('.widget h3', async (headers: any[]) => {
        const contribHeader = headers.find(h => h.textContent?.includes('Contributors'));
        if (!contribHeader) return [];
        const list = contribHeader.nextElementSibling;
        if (!list) return [];
        return Array.from(list.querySelectorAll('a')).map((a: any) => a.textContent?.trim());
      });
      return contributors.filter(Boolean).join(', ');
    } catch (error) {
      return '';
    }
  }

  private async extractHomepage(page: any): Promise<string> {
    try {
      const homepage = await page.$$eval('.widget a', (links: any[]) => {
        const homepageLink = links.find(link => link.textContent?.includes('Plugin Homepage'));
        return homepageLink?.getAttribute('href') || '';
      });
      return homepage;
    } catch (error) {
      return '';
    }
  }

  private async extractExtendedDescription(page: any): Promise<string> {
    try {
      // Try multiple selectors for the description
      const selectors = ['#tab-description', '.plugin-description', '.entry-content'];
      
      for (const selector of selectors) {
        const descElement = await page.$(selector);
        if (descElement) {
          // Extract text content, cleaning up whitespace and removing header
          const fullText = await descElement.evaluate((el: any) => {
            // Remove the "Description" header if present
            const header = el.querySelector('h2');
            if (header && header.textContent?.includes('Description')) {
              header.remove();
            }
            
            // Get all text content, preserving some structure
            const textElements = el.querySelectorAll('p, h3, h4, h5, li');
            const texts: string[] = [];
            
            textElements.forEach((elem: any) => {
              const text = elem.textContent?.trim();
              if (text && text.length > 0) {
                texts.push(text);
              }
            });
            
            // Join with space, limit length to avoid extremely long descriptions
            return texts.join(' ').replace(/\s+/g, ' ').trim();
          });
          
          if (fullText && fullText.length > 50) {
            // Limit to reasonable length (e.g., 2000 chars)
            return fullText.slice(0, 2000);
          }
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting extended description:', error);
      return '';
    }
  }
}