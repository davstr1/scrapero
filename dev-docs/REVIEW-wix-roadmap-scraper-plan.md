# Wix Roadmap Scraper Implementation Plan

## Overview
This scraper will collect user feature requests from Wix's roadmap API. Unlike traditional HTML scrapers, this works with a JSON API that returns structured data.

## Key Characteristics
- **Data Source**: JSON API (not HTML scraping)
- **Purpose**: Analyze user requests to identify opportunities
- **Pagination**: 500 items per page max
- **Total Items**: ~2033 items (as of sample)

## Implementation Approach

### 1. Scraper Type
Create a **JavaScript/Module-based scraper** following the `wix-app-market-nojs` pattern:
- Standalone JS module
- Uses existing `HttpClient` for API calls
- Direct JSON parsing (no HTML/Cheerio needed)
- Simple and efficient for API consumption

### 2. Core Components

#### A. Configuration Structure
```javascript
{
  name: "wix-roadmap",
  baseUrl: "https://support.wix.com/en/api/article/search",
  type: "api",
  rateLimit: {
    maxRequestsPerSecond: 2,
    maxConcurrency: 1
  },
  outputs: ["csv", "json"],
  fields: ["title", "description", "url", "resolution", "creationDate", "labels"]
}
```

#### B. API Parameters
- Base parameters for all requests:
  - `locale`: "en"
  - `text`: "+"
  - `pageSize`: 500
  - `useVespa`: false
  - `statuses[]`: [10, 0]
  - `resolutions[]`: [110, 111, 112, 114, 115, 116]

#### C. Label Processing
- Extract label IDs from the massive URL
- Map to category names using provided mapping
- Consider iterating through labels individually for better organization

### 3. Data Schema
```javascript
{
  id: string,
  title: string,
  description: string,
  url: string,
  resolution: string, // Mapped from code
  resolutionCode: number,
  status: string, // "Collecting votes", "Planned", etc.
  creationDate: Date,
  readingTime: number,
  categories: string[], // Mapped from label IDs
  categoryIds: string[]
}
```

### 4. Implementation Steps

#### Phase 1: Setup
- [ ] Create `src/scrapers/wix-roadmap/` directory
- [ ] Copy and adapt `HttpClient` from existing scrapers
- [ ] Create configuration file
- [ ] Set up project structure

#### Phase 2: Core Scraper
- [ ] Implement main scraper module
- [ ] Add resolution mapping (110 → "Collecting votes", etc.)
- [ ] Add label ID to category name mapping
- [ ] Implement pagination logic

#### Phase 3: Data Processing
- [ ] Create data transformers
- [ ] Add date formatting
- [ ] Implement deduplication (by ID)
- [ ] Add validation

#### Phase 4: Output & Testing
- [ ] Configure CSV output adapter
- [ ] Set up JSON file storage
- [ ] Test with single page first
- [ ] Test full pagination
- [ ] Verify data integrity

### 5. Technical Considerations

#### A. Pagination Strategy
```javascript
async function* fetchAllPages() {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const data = await fetchPage(page);
    yield data.items;
    
    hasMore = data.items.length === 500;
    page++;
  }
}
```

#### B. Error Handling
- Retry failed API calls
- Handle rate limiting
- Track failed pages for resume capability
- Validate response structure

#### C. Performance Optimization
- Single-threaded execution (API is fast)
- Minimal concurrency to respect rate limits
- Batch processing for outputs
- Progress tracking

### 6. Advanced Features (Optional)

#### A. Label-based Scraping
Instead of fetching all labels at once:
1. Iterate through each label ID separately
2. Organize data by category
3. Avoid duplicate processing
4. Better progress tracking

#### B. Incremental Updates
- Track last scrape date
- Fetch only new items
- Update existing records

#### C. Analytics
- Count requests by status
- Trend analysis by creation date
- Popular categories
- Resolution velocity

### 7. File Structure
```
wix-roadmap/
├── index.js              # Main scraper entry
├── config.json          # Configuration
├── lib/
│   ├── http-client.js   # API client
│   ├── api-fetcher.js   # API interaction logic
│   ├── transformers.js  # Data transformation
│   └── mappings.js      # Resolution/label mappings
└── outputs/
    ├── csv-adapter.js   # CSV output
    └── json-adapter.js  # JSON output
```

### 8. MVP Implementation Priority
1. **Essential**: Basic API fetching with pagination
2. **Essential**: Resolution and label mapping
3. **Essential**: CSV output
4. **Nice-to-have**: Progress tracking
5. **Nice-to-have**: Resume capability
6. **Future**: Analytics and incremental updates

## Next Steps
1. Create the scraper directory structure
2. Implement basic API fetching
3. Add data transformation
4. Test with a small dataset
5. Scale to full dataset
6. Add error handling and resilience