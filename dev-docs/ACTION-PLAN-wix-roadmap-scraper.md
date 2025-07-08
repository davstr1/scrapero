# Action Plan: Wix Roadmap Scraper Implementation

## Phase 1: Project Setup (Foundation)

### [ ] 1. Create directory structure
- [ ] Create `src/scrapers/wix-roadmap/` directory
- [ ] Create `src/scrapers/wix-roadmap/lib/` subdirectory
- [ ] Create `src/scrapers/wix-roadmap/outputs/` subdirectory

### [ ] 2. Copy and adapt HttpClient
- [ ] Copy `http-client.js` from `src/scrapers/wix-app-market-nojs/lib/`
- [ ] Remove HTML-specific features (not needed for JSON API)
- [ ] Verify axios and retry logic work for JSON responses
- [ ] Test basic GET request to Wix API endpoint

### [ ] 3. Create mappings.js
- [ ] Create resolution code mappings (110→"Collecting votes", etc.)
- [ ] Create label ID to category name mappings (60+ mappings)
- [ ] Add helper functions: `getResolutionName(code)`, `getCategoryNames(labelIds)`
- [ ] Export all mappings and helpers

### [ ] 4. Create config.json
- [ ] Define scraper name: "wix-roadmap"
- [ ] Set base URL: "https://support.wix.com/en/api/article/search"
- [ ] Configure rate limiting (2 req/sec, concurrency: 1)
- [ ] Define output formats: ["csv", "json"]
- [ ] List all label IDs to scrape

## Phase 2: Core Implementation

### [ ] 5. Implement api-fetcher.js
- [ ] Create function to build API URL with all parameters
- [ ] Implement `fetchPage(pageNumber)` function
- [ ] Add response validation
- [ ] Create `fetchAllPages()` generator function
- [ ] Test with page 1, limit 10 items

### [ ] 6. Create transformers.js
- [ ] Implement `transformItem(rawItem)` function
- [ ] Map resolution codes to names
- [ ] Map label IDs to category names
- [ ] Convert timestamp to readable date
- [ ] Format all fields per schema
- [ ] Add data validation

### [ ] 7. Implement main index.js
- [ ] Set up imports and configuration loading
- [ ] Initialize HttpClient
- [ ] Create main `scrape()` function
- [ ] Implement pagination loop
- [ ] Add basic console logging
- [ ] Handle errors gracefully

## Phase 3: Output Adapters

### [ ] 8. Create CSV output adapter
- [ ] Copy structure from existing CSV adapters
- [ ] Define CSV headers matching schema
- [ ] Handle array fields (categories) properly
- [ ] Implement streaming writes for large datasets
- [ ] Add file naming with timestamp

### [ ] 9. Create JSON output adapter
- [ ] Implement simple JSON file writer
- [ ] Format output as array of items
- [ ] Pretty-print for readability
- [ ] Add metadata (scrape date, item count)

## Phase 4: Testing & Validation

### [ ] 10. Test with limited dataset
- [ ] Modify fetcher to limit to 10 items
- [ ] Run full scraper flow
- [ ] Verify CSV output format
- [ ] Verify JSON output format
- [ ] Check data transformation accuracy

### [ ] 11. Add error handling
- [ ] Add try-catch blocks in all async functions
- [ ] Implement retry logic for failed API calls
- [ ] Log errors with context
- [ ] Ensure scraper doesn't crash on errors
- [ ] Add graceful shutdown handling

## Phase 5: Full Implementation

### [ ] 12. Add progress tracking
- [ ] Count total items from first response
- [ ] Show progress percentage
- [ ] Display current page number
- [ ] Show items processed
- [ ] Add ETA calculation

### [ ] 13. Test full pagination
- [ ] Remove item limit
- [ ] Run scraper for all 2000+ items
- [ ] Monitor memory usage
- [ ] Verify all pages fetched
- [ ] Check final item count

### [ ] 14. Implement deduplication
- [ ] Track item IDs in Set
- [ ] Skip duplicate items
- [ ] Log duplicate count
- [ ] Ensure no data loss

### [ ] 15. Final verification
- [ ] Verify CSV has all expected columns
- [ ] Check date formatting is consistent
- [ ] Ensure categories are properly mapped
- [ ] Validate against sample data
- [ ] Document any issues found

## Execution Order

1. **Start with Phase 1** - Get foundation ready
2. **Move to Phase 2** - Build core functionality
3. **Quick test** after step 7 to verify basics work
4. **Phase 3** - Add output capabilities
5. **Phase 4** - Validate with small dataset
6. **Phase 5** - Scale to full dataset

## Time Estimates

- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 30 minutes
- Phase 4: 20 minutes
- Phase 5: 30 minutes

**Total: ~2.5 hours for MVP**

## Success Criteria

- [ ] Scraper runs without errors
- [ ] All 2000+ items collected
- [ ] CSV output is properly formatted
- [ ] Data is accurately transformed
- [ ] Categories are correctly mapped
- [ ] Dates are human-readable
- [ ] No duplicate items in output