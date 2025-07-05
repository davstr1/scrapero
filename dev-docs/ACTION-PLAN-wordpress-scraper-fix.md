# Action Plan: Fix WordPress Commercial Plugins Scraper

## Date: 2025-07-05
## Priority: CRITICAL

## Phase 1: Analyze Current Implementation

- [ ] Read and understand the current wordpressScraper.js implementation
- [ ] Read and understand the wordpress-commercial-plugins.js configuration
- [ ] Identify exact code locations causing each issue
- [ ] Document the current scraping flow

## Phase 2: Fix URL Selection Logic

- [ ] Replace generic `a[href*="/plugins/"]` selector with proper plugin card selector
- [ ] Use the configured selector `article.plugin-card` from the config file
- [ ] Ensure only actual plugin cards are selected, not navigation links
- [ ] Add URL validation to ensure we're processing plugin detail pages

## Phase 3: Fix Data Extraction

- [ ] Implement proper selector usage from configuration
  - [ ] Use `h3.entry-title a` for plugin name
  - [ ] Use `.plugin-icon img` for icon URL
  - [ ] Use proper selectors for author, rating, etc.
- [ ] Remove hardcoded author patterns array
- [ ] Extract author from proper plugin metadata element
- [ ] Fix description extraction to get clean text without HTML/whitespace

## Phase 4: Fix Data Scoping Issues

- [ ] Identify variable scoping issue causing Elementor data contamination
- [ ] Ensure each plugin gets its own fresh data object
- [ ] Clear/reset data between plugin extractions
- [ ] Add proper null/undefined checks for missing data

## Phase 5: Implement Commercial Plugin Filtering

- [ ] Navigate to the correct commercial plugins URL
- [ ] Use URL parameter `?plugin_business_model=commercial`
- [ ] Verify we're on the commercial plugins listing page
- [ ] Add business model validation

## Phase 6: Implement Pagination

- [ ] Use configured pagination settings from config file
- [ ] Implement page navigation using pagination selectors
- [ ] Set reasonable page limit to avoid infinite loops
- [ ] Track progress through pages

## Phase 7: Add Data Validation

- [ ] Validate each plugin has required fields before adding to results
- [ ] Add fallback values for optional fields
- [ ] Ensure no multi-line values in CSV fields
- [ ] Normalize whitespace in all text fields

## Phase 8: Error Handling

- [ ] Add try-catch blocks around data extraction
- [ ] Log errors for debugging without crashing scraper
- [ ] Skip invalid plugins instead of failing entire scrape
- [ ] Add timeout handling for slow page loads

## Phase 9: Testing

- [ ] Test with a single page first
- [ ] Verify correct plugin data extraction
- [ ] Test pagination works correctly
- [ ] Verify CSV output is properly formatted
- [ ] Check for data contamination between plugins

## Phase 10: Final Validation

- [ ] Run full scrape of commercial plugins
- [ ] Validate CSV has proper headers
- [ ] Ensure no malformed rows
- [ ] Verify reasonable plugin count (should be hundreds/thousands)
- [ ] Spot check random plugins for data accuracy

## Success Criteria

1. CSV contains only actual WordPress plugins (no navigation links)
2. Each plugin has unique, correct data (no Elementor contamination)
3. Descriptions are clean single-line text
4. All configured fields are properly populated
5. Pagination works to get all commercial plugins
6. CSV is properly formatted and parseable