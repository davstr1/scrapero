# WordPress Commercial Plugins Scraper Documentation

## Overview
This document outlines the creation of a scraper for WordPress.org commercial plugins directory using our industrial-scale scraping system.

## Target URL
https://wordpress.org/plugins/?plugin_business_model=commercial

## Identified Data Structure

Based on WordPress plugin directory patterns, each plugin card typically contains:

### Plugin Information
1. **Plugin Name**: Usually in an h3 or h2 tag with class `entry-title`
2. **Plugin Author**: Often in a span with class `author` or `byline`
3. **Description**: Short excerpt in a paragraph tag
4. **Rating**: Star rating displayed with class `rating` or `star-rating`
5. **Rating Count**: Number in parentheses after stars
6. **Active Installations**: Text like "10,000+ active installations"
7. **Last Updated**: Date text, often with "Updated" prefix
8. **Tested up to**: WordPress version compatibility (e.g., "6.8.1")
9. **Plugin URL**: Link to the plugin detail page
10. **Plugin Icon**: Image with plugin logo

### Typical Selectors (WordPress.org pattern)
```css
/* Plugin container */
article.plugin-card

/* Plugin details */
h3.entry-title a              /* Plugin name and link */
.plugin-author                /* Author info */
.plugin-desc                  /* Description */
.star-rating                  /* Rating stars */
.rating-count                 /* Number of ratings */
.active-installs              /* Installation count */
.plugin-last-updated          /* Last update date */
.tested-up-to                 /* WordPress version compatibility */
.plugin-icon img              /* Plugin icon */

/* Pagination */
.pagination-links a.next      /* Next page link */
```

## Implementation Plan

### Step 1: Generate the Scraper
```bash
npm run scraper generate wordpress-plugins -- --type playwright
```

### Step 2: Configure the Scraper

Create/update `src/scrapers/wordpress-plugins/config.json`:

```json
{
  "extends": "global",
  "name": "wordpress-plugins",
  "baseUrl": "https://wordpress.org/plugins",
  "crawlerType": "playwright",
  "selectors": {
    "pluginCard": "article.plugin-card",
    "pluginName": "h3.entry-title a",
    "pluginUrl": "h3.entry-title a",
    "author": ".plugin-author",
    "description": ".plugin-desc",
    "rating": ".star-rating",
    "ratingCount": ".rating-count",
    "activeInstalls": ".active-installs",
    "lastUpdated": ".plugin-last-updated",
    "testedUpTo": ".tested-up-to",
    "pluginIcon": ".plugin-icon img"
  },
  "pagination": {
    "nextButtonSelector": ".pagination-links a.next",
    "maxPages": 10
  },
  "outputs": [
    {
      "type": "csv",
      "enabled": true,
      "config": {
        "filename": "wordpress-commercial-plugins-{date}.csv",
        "path": "./exports",
        "headers": true
      }
    }
  ],
  "pipeline": {
    "processors": ["validation", "normalization"],
    "errorHandling": "continue",
    "batchSize": 50
  },
  "proxy": {
    "enabled": false,
    "rotation": "session"
  },
  "rateLimit": {
    "requestsPerMinute": 20,
    "delayBetweenRequests": 3000
  }
}
```

### Step 3: Implement the Scraper Logic

Update `src/scrapers/wordpress-plugins/index.ts`:

```typescript
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
    const selectors = this.config.selectors;

    // Wait for plugin cards to load
    await page.waitForSelector(selectors.pluginCard, { timeout: 10000 });

    // Extract all plugins on the page
    const plugins = await page.evaluate((sel) => {
      const pluginCards = document.querySelectorAll(sel.pluginCard);
      
      return Array.from(pluginCards).map(card => {
        const getTextContent = (selector: string) => {
          const element = card.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getAttr = (selector: string, attr: string) => {
          const element = card.querySelector(selector);
          return element?.getAttribute(attr) || '';
        };

        // Extract rating value
        const ratingElement = card.querySelector(sel.rating);
        let ratingValue = 0;
        if (ratingElement) {
          const ratingClass = ratingElement.getAttribute('class') || '';
          const match = ratingClass.match(/rating-(\d+)/);
          ratingValue = match ? parseInt(match[1]) / 20 : 0; // Convert to 0-5 scale
        }

        // Parse active installations
        const installsText = getTextContent(sel.activeInstalls);
        const installsMatch = installsText.match(/([0-9,]+)\+?\s*active/i);
        const activeInstalls = installsMatch ? installsMatch[1].replace(/,/g, '') : '0';

        // Parse rating count
        const ratingText = getTextContent(sel.ratingCount);
        const ratingMatch = ratingText.match(/\((\d+)/);
        const ratingCount = ratingMatch ? ratingMatch[1] : '0';

        // Parse WordPress version compatibility
        const testedUpToText = getTextContent(sel.testedUpTo);
        const versionMatch = testedUpToText.match(/(\d+\.\d+(?:\.\d+)?)/);
        const testedUpTo = versionMatch ? versionMatch[1] : '';

        return {
          name: getTextContent(sel.pluginName),
          url: getAttr(sel.pluginUrl, 'href'),
          author: getTextContent(sel.author),
          description: getTextContent(sel.description),
          rating: ratingValue,
          ratingCount: parseInt(ratingCount),
          activeInstalls: parseInt(activeInstalls),
          lastUpdated: getTextContent(sel.lastUpdated),
          testedUpTo: testedUpTo,
          iconUrl: getAttr(sel.pluginIcon, 'src'),
          businessModel: 'commercial',
          scrapedAt: new Date().toISOString()
        };
      });
    }, selectors);

    return plugins;
  }
}
```

### Step 4: Handle Pagination

For handling pagination with Playwright, we can use Crawlee's built-in pagination support or implement custom logic:

```typescript
// In the scraper configuration, add:
"crawler": {
  "handlePageFunction": async ({ page, request, enqueueLinks }) => {
    // Extract data from current page
    const data = await this.extractData({ page, request });
    
    // Enqueue next page if exists
    const nextPageSelector = this.config.pagination.nextButtonSelector;
    const nextPageExists = await page.$(nextPageSelector);
    
    if (nextPageExists) {
      await enqueueLinks({
        selector: nextPageSelector,
        limit: 1
      });
    }
    
    return data;
  }
}
```

## Running the Scraper

### Test Run
```bash
# Run with specific URL
npm run scraper run wordpress-plugins --urls "https://wordpress.org/plugins/?plugin_business_model=commercial"

# Run with pagination limit
npm run scraper run wordpress-plugins --urls "https://wordpress.org/plugins/?plugin_business_model=commercial" --env dev
```

### Production Run
```bash
npm run scraper run wordpress-plugins --env prod
```

## Expected Output

The scraper will generate a CSV file with the following columns:
- name
- url
- author
- description
- rating (0-5)
- ratingCount
- activeInstalls
- lastUpdated
- testedUpTo (WordPress version compatibility)
- iconUrl
- businessModel
- scrapedAt

## Troubleshooting

### Common Issues

1. **Selectors not working**: WordPress.org might use different selectors. Use browser DevTools to inspect and update selectors.

2. **Rate limiting**: WordPress.org might rate limit requests. Adjust `rateLimit` in config:
   ```json
   "rateLimit": {
     "requestsPerMinute": 10,
     "delayBetweenRequests": 6000
   }
   ```

3. **Dynamic content loading**: Some content might load via JavaScript. Ensure Playwright waits for content:
   ```typescript
   await page.waitForSelector(selectors.pluginCard, { 
     timeout: 30000,
     waitUntil: 'networkidle' 
   });
   ```

## Data Processing

Consider adding processors for:
- Normalizing installation numbers (e.g., "10,000+" → 10000)
- Converting rating classes to numeric values
- Parsing and standardizing dates
- Validating URLs

## Next Steps

1. Test the scraper with a small page limit
2. Verify data quality and completeness
3. Add data validation rules
4. Consider implementing database output for larger datasets
5. Set up scheduled runs if needed