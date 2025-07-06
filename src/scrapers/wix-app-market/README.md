# Wix App Market Scraper

A comprehensive scraper for the Wix App Market using Puppeteer to handle JavaScript-rendered content.

## Features

- 🌐 Browser pool management with concurrent scraping
- 🔄 Proxy support with authentication
- 📊 Full app data extraction (28 fields)
- 🔍 Category and subcategory discovery
- 💾 Resume capability for interrupted scrapes
- 📈 Progress tracking and error handling

## Installation

```bash
cd src/scrapers/wix-app-market
npm install
```

## Usage

### Test Single App
```bash
node index.js test
# Or with custom URL:
node index.js test -u https://www.wix.com/app-market/web-solution/your-app
```

### Discover Categories
```bash
node index.js discover-categories
# Output: temp/categories.json
```

### Collect App URLs
```bash
node index.js collect-urls
# Input: temp/categories.json
# Output: temp/app-urls.csv
```

### Scrape App Details
```bash
node index.js scrape-apps
# Input: temp/app-urls.csv
# Output: output/wix-apps.csv

# With options:
node index.js scrape-apps -r           # Resume from last position
node index.js scrape-apps -l 100       # Limit to 100 apps
```

### Run Full Pipeline
```bash
node index.js full
# Or resume interrupted pipeline:
node index.js full -r
```

## Configuration

Edit `config/config.json` to customize:

- **Browser settings**: Concurrency, timeouts, viewport
- **Proxy settings**: Enable/disable, proxy URL
- **Delays**: Between requests, after scrolling
- **Retry settings**: Max attempts, backoff
- **Selectors**: CSS selectors for data extraction

### Key Configuration Options

```json
{
  "browser": {
    "headless": true,
    "concurrency": 5,
    "pageTimeout": 60000
  },
  "proxy": {
    "enabled": false,
    "url": "http://user:pass@proxy:port/"
  },
  "delays": {
    "betweenRequests": 3000,
    "afterScroll": 1000
  }
}
```

## Output Format

The scraper outputs CSV files with the following fields:

- `name` - App name
- `slug` - URL slug
- `url` - Full app URL
- `icon` - Icon image URL
- `shortDescription` - Brief description
- `fullDescription` - Complete description
- `averageRating` - Rating out of 5
- `totalReviews` - Number of reviews
- `rating5Star` through `rating1Star` - Rating breakdown
- `hasFreeVersion` - Boolean
- `pricingTiers` - JSON array of pricing
- `developer` - Developer name
- `developerEmail` - Contact email
- `developerWebsite` - Developer site
- `installCount` - Installation statistics
- `primaryCategory` - Main category
- `subCategory` - Subcategory
- `tags` - Comma-separated tags
- `screenshots` - JSON array of URLs
- `languages` - Supported languages
- `lastUpdated` - Last update date
- `scrapedAt` - Scraping timestamp

## Troubleshooting

### Proxy Issues
- If you get `ERR_NO_SUPPORTED_PROXIES`, check proxy format
- Disable proxy in config for testing: `"enabled": false`

### Timeout Issues
- Increase `pageTimeout` and `navigationTimeout` in config
- Reduce `concurrency` for slower connections

### Missing Data
- The selectors may need adjustment as Wix updates their site
- Check `temp/screenshots/` for error screenshots
- Enable `saveHtmlOnError` in config for debugging

## Performance

With default settings:
- ~5-10 apps per minute per browser instance
- 5 concurrent browsers = ~25-50 apps per minute
- Full scrape (~500-1000 apps) = 2-4 hours

## Files Generated

- `temp/categories.json` - Category structure
- `temp/app-urls.csv` - Collected app URLs
- `temp/scrape-progress.json` - Progress tracking
- `temp/failed-apps.csv` - Failed scrapes
- `output/wix-apps.csv` - Final scraped data

## Notes

- Wix App Market uses heavy JavaScript rendering
- Some fields may be empty due to dynamic loading
- The scraper respects rate limits with configurable delays
- Always test with a small batch before full scraping