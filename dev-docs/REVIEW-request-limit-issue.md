# Review: WordPress Scraper Request Limit Issue

## Issue Summary
The WordPress scraper is only extracting 10 plugins out of 20 found on the listing page due to `maxRequestsPerCrawl` configuration limit.

## Root Cause Analysis

### Current Behavior:
1. Scraper visits commercial plugins listing page (1 request)
2. Finds 20 plugin cards on the page
3. Attempts to enqueue 20 detail page requests
4. Crawlee stops at 10 total requests due to `maxRequestsPerCrawl: 10` in config
5. Only 9 plugins get scraped (1 listing + 9 detail pages = 10 requests)

### Configuration Issue:
In `/src/scrapers/wordpress-plugins/config.json`:
```json
"maxRequestsPerCrawl": 10
```

This limit includes ALL requests:
- Listing page requests
- Detail page requests  
- Pagination requests

## Impact
- Missing 50%+ of available plugins
- Incomplete data extraction
- Users not getting full marketplace coverage

## Solution Options

### Option 1: Increase maxRequestsPerCrawl (Recommended)
- Set to a higher value (e.g., 100 or 500)
- Allows complete scraping of multiple pages
- Simple one-line fix

### Option 2: Remove the limit
- Set `maxRequestsPerCrawl` to `null` or remove the property
- Scraper will process all found links
- Risk: Could run indefinitely if pagination logic has issues

### Option 3: Make it configurable via CLI
- Add CLI parameter to override the limit
- Provides flexibility for different use cases
- More complex implementation

## Recommendation
Increase `maxRequestsPerCrawl` to at least 100 to handle:
- Multiple listing pages (with pagination)
- All plugins on each page (20 per page)
- Buffer for retries or additional requests

This would allow scraping ~4-5 pages of results comprehensively.