# Review: WordPress Scraper Pagination Implementation

## Current Status
Pagination is **partially implemented** but has significant limitations.

## Implementation Analysis

### Code Implementation (in `index.ts`):
```typescript
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
```

### Configuration (in `config.json`):
```json
"pagination": {
  "nextButtonSelector": ".pagination-links a.next",
  "maxPages": 2
}
```

## Current Limitations

1. **Hard-coded page limit**: Line 194 has `pageNumber < 2`, limiting to only 2 pages regardless of config
2. **Inconsistent with config**: Config says `maxPages: 2` but code doesn't use this value
3. **No page tracking in logs**: No indication of which page is being processed
4. **Limited request capacity**: With 100 `maxRequestsPerCrawl` and ~20 plugins per page, can only handle ~4-5 pages

## What Works
- Basic pagination logic exists
- Correctly identifies and clicks next page button
- Handles relative URLs properly

## What Needs Fixing

### Issue 1: Page Limit
- Code hard-codes page limit to 2
- Should use `config.pagination.maxPages` value
- Currently ignores configuration setting

### Issue 2: Request Capacity
- 100 requests might be too low for multiple pages
- Each page = 1 listing request + 20 detail requests = 21 requests
- 5 pages would need ~105 requests

### Issue 3: Progress Tracking
- No clear indication of pagination progress
- Should log current page number

## Recommendations

1. **Use config value for max pages**
   - Replace hard-coded `< 2` with `< this.config.pagination.maxPages`

2. **Increase request limit**
   - Set `maxRequestsPerCrawl` to 500+ for comprehensive scraping
   - Or calculate dynamically based on maxPages

3. **Add pagination logging**
   - Log "Processing page X of Y"
   - Track total plugins found across all pages

4. **Consider pagination strategy**
   - Option A: Scrape all pages (remove limit)
   - Option B: Make pages configurable via CLI
   - Option C: Keep reasonable default (5-10 pages)