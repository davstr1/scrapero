# Action Plan: Wix App Market No-JS Scraper Implementation

## Overview
Transform the existing Puppeteer-based Wix scraper to use HTTP requests without JavaScript rendering, based on discoveries from the no-JS analysis.

## Phase 1: Create HTTP-Based Infrastructure
- [ ] Create new directory structure: `/src/scrapers/wix-app-market-nojs/`
- [ ] Install required dependencies: axios, cheerio
- [ ] Create base HTTP client with proper headers and error handling
- [ ] Implement request throttling and retry logic
- [ ] Add proxy support for HTTP requests

## Phase 2: Build URL Discovery Module
- [ ] Create homepage scraper to extract all main category URLs
- [ ] For each category, extract subcategory links
- [ ] Build subcategory scraper to find "View All X Apps" patterns
- [ ] Extract app URLs from category/subcategory pages (pattern: `/web-solution/`)
- [ ] Save discovered URLs to `urls.json` with timestamps
- [ ] Implement deduplication logic

## Phase 3: Create Category Mapping
- [ ] Hardcode known category/subcategory structure as fallback
- [ ] Build dynamic category discovery from navigation
- [ ] Map category slugs to human-readable names
- [ ] Count apps per category/subcategory
- [ ] Export category structure to `categories.json`

## Phase 4: Implement App Detail Scraper
- [ ] Create app page fetcher using axios
- [ ] Build text-based extraction for app name (H1/H2 elements)
- [ ] Extract rating using "out of 5" text pattern
- [ ] Find review count near rating text
- [ ] Extract pricing information (look for currency symbols)
- [ ] Get developer info from external links
- [ ] Extract description paragraphs
- [ ] Find app icon (first non-Wix logo image)
- [ ] Extract feature list from bullet points
- [ ] Get screenshots from image galleries

## Phase 5: Create Data Extraction Helpers
- [ ] Build cheerio selector helpers for common patterns
- [ ] Create text pattern matchers for ratings, installs, prices
- [ ] Implement fallback extraction strategies
- [ ] Add data validation and cleaning functions
- [ ] Create debug mode to save HTML for failed extractions

## Phase 6: Build Main Orchestrator
- [ ] Create CLI with commands: discover, scrape, full
- [ ] Implement progress tracking and resumability
- [ ] Add CSV export functionality
- [ ] Create rate limiting to avoid blocks
- [ ] Add comprehensive error handling and logging

## Phase 7: Testing & Validation
- [ ] Test URL discovery on all categories
- [ ] Validate app data extraction on 10 diverse apps
- [ ] Check for missing fields and implement fallbacks
- [ ] Test with proxies if needed
- [ ] Verify CSV output format

## Phase 8: Optimization
- [ ] Implement concurrent requests (limit 5-10)
- [ ] Add caching for already-scraped apps
- [ ] Create incremental update mode
- [ ] Optimize memory usage for large datasets
- [ ] Add performance metrics

## Phase 9: Documentation
- [ ] Document all extraction patterns found
- [ ] Create usage guide for CLI
- [ ] Add examples of extracted data
- [ ] Document known limitations
- [ ] Create troubleshooting guide

## Technical Implementation Details

### File Structure
```
/src/scrapers/wix-app-market-nojs/
├── index.js           # CLI entry point
├── config.json        # Configuration
├── lib/
│   ├── http-client.js # Axios wrapper with retries
│   ├── url-discovery.js # Find all app URLs
│   ├── app-scraper.js # Extract app details
│   ├── extractors.js  # Text pattern extractors
│   └── utils.js       # Helper functions
├── data/
│   ├── urls.json      # Discovered URLs
│   ├── categories.json # Category structure
│   └── apps.csv       # Scraped data
└── debug/             # HTML saves for debugging
```

### Key Code Patterns

#### HTTP Client
```javascript
const axios = require('axios');
const axiosRetry = require('axios-retry');

const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
  }
});

axiosRetry(client, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
```

#### Text Pattern Extraction
```javascript
function extractRating($) {
  const ratingPattern = /(\d+\.?\d*)\s*out of 5/i;
  const pageText = $('body').text();
  const match = pageText.match(ratingPattern);
  return match ? parseFloat(match[1]) : 0;
}

function extractInstalls($) {
  const patterns = [
    /(\d+[,\d]*\+?)\s*installs/i,
    /installed on\s*(\d+[,\d]*\+?)/i,
    /(\d+[,\d]*\+?)\s*active installs/i
  ];
  
  const pageText = $('body').text();
  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (match) return match[1];
  }
  return '';
}
```

### Success Criteria
- [ ] Successfully discover 500+ app URLs
- [ ] Extract complete data for 95%+ of apps
- [ ] Process all apps in under 2 hours
- [ ] Generate clean CSV with all required fields
- [ ] No JavaScript rendering needed