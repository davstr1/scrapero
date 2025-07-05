# Action Plan: Implement WordPress Plugin Detail Page Parsing

## Date: 2025-07-05
## Priority: HIGH

## Phase 1: Setup Two-Phase Architecture

- [ ] Modify extractData method to handle both listing and detail pages
- [ ] Add isDetailPage flag check in request handler
- [ ] Create separate methods for listing vs detail extraction
- [ ] Test basic routing between page types

## Phase 2: Implement Detail Page Detection

- [ ] Add logic to detect if current page is listing or detail
- [ ] Create extractListingPageData method (move current logic)
- [ ] Create extractDetailPageData method stub
- [ ] Ensure proper data flow between methods

## Phase 3: Enqueue Detail Pages

- [ ] After extracting listing data, enqueue each plugin's detail URL
- [ ] Add userData with isDetailPage flag
- [ ] Include plugin slug for identification
- [ ] Pass listing data for later merging
- [ ] Test enqueueing mechanism

## Phase 4: Extract Essential Detail Fields

- [ ] Extract plugin version from `.widget.plugin-meta li`
- [ ] Extract last updated date from meta widget
- [ ] Extract download URL from `.plugin-download a.button`
- [ ] Calculate days since last update
- [ ] Test extraction with multiple plugins

## Phase 5: Extract Requirements Fields

- [ ] Extract minimum WordPress version
- [ ] Extract minimum PHP version
- [ ] Add error handling for missing requirements
- [ ] Validate version format (x.x.x)

## Phase 6: Extract Support Statistics

- [ ] Find support threads total count
- [ ] Find resolved threads count
- [ ] Calculate support response rate
- [ ] Handle cases with no support data

## Phase 7: Extract Additional Metadata

- [ ] Extract plugin tags from `.widget.entry-meta .tags a`
- [ ] Extract contributors list
- [ ] Extract plugin homepage URL
- [ ] Extract ratings breakdown (1-5 stars distribution)

## Phase 8: Merge Data and Output

- [ ] Merge listing data with detail data
- [ ] Handle missing detail page data gracefully
- [ ] Ensure all fields are included in final output
- [ ] Update CSV headers to include new fields

## Phase 9: Update Configuration

- [ ] Reduce rate limit to 10 requests/minute
- [ ] Increase delay between requests to 6 seconds
- [ ] Set max concurrency to 2
- [ ] Update maxRequestsPerCrawl for detail pages

## Phase 10: Error Handling

- [ ] Handle 404 errors for plugin pages
- [ ] Handle rate limit (429) responses
- [ ] Implement exponential backoff
- [ ] Log failed detail page fetches
- [ ] Continue processing even if some details fail

## Phase 11: Testing

- [ ] Test with 5 plugins first
- [ ] Verify all new fields are populated
- [ ] Check CSV output format
- [ ] Test error scenarios (404, timeout)
- [ ] Verify rate limiting works

## Phase 12: Performance Optimization

- [ ] Monitor memory usage with many requests
- [ ] Add progress logging
- [ ] Consider implementing basic caching
- [ ] Optimize selector queries

## Phase 13: Documentation

- [ ] Update scraper documentation
- [ ] Document new CSV fields
- [ ] Add example of enriched output
- [ ] Note performance implications

## Success Criteria

1. Detail pages are successfully fetched for each plugin
2. All new fields are populated in CSV
3. Rate limiting prevents 429 errors
4. Scraper handles errors gracefully
5. Performance is acceptable (< 5 min for 20 plugins)

## Code Structure

```typescript
// Main structure
async extractData(context: any): Promise<any> {
  if (context.request.userData?.isDetailPage) {
    return this.extractDetailPageData(context);
  } else {
    return this.extractListingPageData(context);
  }
}

// Listing page: extract and enqueue
private async extractListingPageData(context: any): Promise<any> {
  // Current extraction logic
  const plugins = await this.extractPlugins(page);
  
  // Enqueue detail pages
  for (const plugin of plugins) {
    await context.enqueueRequest({
      url: plugin.url,
      userData: {
        isDetailPage: true,
        pluginSlug: this.getSlugFromUrl(plugin.url),
        listingData: plugin
      }
    });
  }
  
  return plugins;
}

// Detail page: extract and merge
private async extractDetailPageData(context: any): Promise<any> {
  const { page, request } = context;
  const { listingData } = request.userData;
  
  const detailData = {
    version: await this.extractVersion(page),
    lastUpdated: await this.extractLastUpdated(page),
    // ... more fields
  };
  
  return { ...listingData, ...detailData };
}
```