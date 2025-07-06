# Wix App Market No-JS Scraper

## Status: Fully Functional ✓

After fixing the extraction patterns, the no-JavaScript scraper works perfectly! Wix does serve content without JavaScript - the initial issue was with incorrect extraction patterns.

## What Works

- ✅ HTTP client with retry logic
- ✅ URL discovery for categories
- ✅ Category mapping and structure
- ✅ App data extraction (ratings, reviews, developer, pricing)
- ✅ CLI interface with all commands
- ✅ CSV export functionality

## Key Discovery

Wix concatenates rating and review data in a unique format: "4.61600 reviews" where:
- 4.6 = rating
- 1600 = number of reviews

## Extraction Capabilities

Successfully extracts:
- App name
- Rating (e.g., 4.6 out of 5)
- Review count
- Developer name
- Description
- Pricing tiers
- Free plan availability
- App icon URL
- Support email
- Tags
- **Subcategories** (NEW): Extracts subcategory information including ID, display name, and parent category

## Usage

```bash
# Install dependencies
npm install

# Discover all app URLs
node index.js discover

# Scrape all discovered apps
node index.js scrape

# Run full process (discover + scrape)
node index.js full

# Test with single app
node index.js test

# Limit number of apps to scrape
node index.js scrape --limit 100

# Export as JSON instead of CSV
node index.js scrape --json
```

## Performance

- No browser overhead (much faster than Puppeteer)
- Concurrent requests with configurable limit
- Rate limiting to avoid blocks
- Resume capability for interrupted scrapes

## Configuration

Edit `config.json` to adjust:
- Concurrent requests (default: 5)
- Request timeout (default: 30s)
- Rate limiting delay (default: 1s)
- Proxy settings (optional)

## Data Format

CSV output includes:
- slug: App identifier
- name: App display name
- url: App page URL
- category: Main category (keyword-based detection)
- additionalCategories: Other categories where the app appears (semicolon-separated)
- subcategories: Semicolon-separated list of subcategories (format: "id:displayName")
- allSubcategories: All subcategories from all category appearances
- rating: Average rating (0-5)
- reviewCount: Number of reviews
- installs: Installation count (if available)
- developer: Developer name
- description: App description
- hasFreeVersion: Boolean
- icon: Icon URL
- lastUpdated: Last update date
- scrapedAt: Scraping timestamp

### Subcategory Format

In CSV, subcategories are formatted as: `accounting:Contabilidad; payments:Payments`

In JSON, subcategories are structured as:
```json
"subcategories": [
  {
    "id": "accounting",
    "displayName": "Contabilidad",
    "parentCategory": "ecommerce",
    "url": "https://es.wix.com/app-market/category/ecommerce/accounting?subCat=accounting"
  }
]
```

## Advantages Over Puppeteer Version

1. **Speed**: 10x+ faster without browser overhead
2. **Resource Usage**: Minimal CPU/memory usage
3. **Reliability**: No browser crashes or memory leaks
4. **Simplicity**: Plain HTTP requests with cheerio parsing
5. **Scalability**: Can run many concurrent requests

## Deduplication

The scraper implements robust deduplication to handle apps that appear in multiple categories:

- **Automatic Deduplication**: Apps are tracked by their unique slug
- **Category Merging**: When an app appears in multiple categories, all categories are preserved
- **Logging**: Duplicate statistics are logged during discovery and before saving
- **Validation**: Built-in duplicate detection warns if any duplicates slip through

### Deduplication Process

1. Apps discovered from sitemap are added first
2. Apps from category pages are merged, preserving additional category data
3. Final output contains exactly one entry per unique app slug
4. All category and subcategory associations are preserved

## Limitations

- Can only access initial page content (no infinite scroll)
- Some dynamic features may not be available
- Limited to ~25 apps per category page

## Recommendation

This no-JS scraper is the preferred approach for Wix App Market due to its speed, reliability, and the fact that Wix serves all essential data without requiring JavaScript.