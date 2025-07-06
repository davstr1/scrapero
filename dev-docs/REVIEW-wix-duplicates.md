# Wix Marketplace Scraper - Duplicate Rows Issue Review

## Issue Summary
The Wix Marketplace Scraper is producing duplicate rows in the output data. Analysis shows each app appears exactly 3 times on average, with some apps appearing up to 5 times.

## Root Causes Identified

### 1. Insufficient Deduplication Logic
- **Location**: `/src/scrapers/wix-app-market-nojs/index.js:44-52`
- **Problem**: Merging logic only deduplicates between sitemap and discovered apps, not within discovered apps
- **Impact**: Apps found in multiple categories are added multiple times

### 2. Category Overlap Not Handled
- **Location**: `/src/scrapers/wix-app-market-nojs/lib/url-discovery.js:275-284`
- **Problem**: Same app discovered in different categories is treated as different entries
- **Impact**: Apps appear once per category they belong to

### 3. Possible Multiple Runs or Append Mode
- **Evidence**: Identical timestamps for the same app at regular intervals
- **Problem**: Results may be appended rather than replaced
- **Impact**: Complete duplicates with identical data

## Actionable Checklist

### Immediate Fixes
- [ ] Implement proper deduplication using app slug as unique identifier
- [ ] Create a Map or Set to track all discovered apps before final output
- [ ] Ensure deduplication happens after ALL discovery sources are merged
- [ ] Fix the merging logic in index.js to check for duplicates globally

### Data Structure Improvements
- [ ] Consolidate category information into arrays for apps in multiple categories
- [ ] Maintain single source of truth per app with aggregated metadata
- [ ] Add validation to prevent duplicate slugs in final output

### Output File Handling
- [ ] Verify if output files are being overwritten vs appended
- [ ] Add timestamp to output filenames if multiple runs are intended
- [ ] Implement atomic write operations to prevent partial duplicates

### Testing & Validation
- [ ] Add unit tests for deduplication logic
- [ ] Create integration test to verify no duplicates in output
- [ ] Add duplicate count validation as part of scraper run
- [ ] Log statistics about duplicates found and removed

### Long-term Improvements
- [ ] Consider using a database or structured storage during scraping
- [ ] Implement incremental scraping with proper state management
- [ ] Add monitoring for duplicate detection in production runs
- [ ] Create a dedicated deduplication utility function

## Code Locations to Modify

1. `/src/scrapers/wix-app-market-nojs/index.js` - Main merging logic
2. `/src/scrapers/wix-app-market-nojs/lib/url-discovery.js` - Discovery deduplication
3. Output writing logic - Ensure clean overwrites

## Expected Outcome
After implementing these fixes, each app should appear exactly once in the output with consolidated metadata from all discovery sources.