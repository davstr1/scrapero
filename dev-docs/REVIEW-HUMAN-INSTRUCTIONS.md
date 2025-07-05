# Review of HUMAN-INSTRUCTIONS.md

## Quick MVP Assessment

### Important: This is a NEW Implementation
**This should be implemented as a separate, parallel scraper alongside the existing WordPress plugin scraper. Do NOT overwrite or replace the current implementation. This is not a v2 - it's a different approach for a different use case.**

### Current State
The document outlines a new WordPress plugin scraping approach that differs from the current implementation. It proposes a two-phase process:
1. Download large SVN file and extract plugin slugs to CSV
2. Scrape individual plugin pages using those slugs

### Actionable Checklist

- [ ] **Create New Scraper Directory** - Set up new directory structure (e.g., `wordpress-plugins-svn`) separate from existing implementation
- [ ] **SVN Download Strategy** - Need to implement downloading from https://plugins.svn.wordpress.org/ with proper handling for large file
- [ ] **Slug Extraction** - Build parser to extract plugin slugs from SVN data and save to CSV
- [ ] **URL Mapping** - Implement slug-to-URL conversion (SVN slug → WordPress.org plugin page)
- [ ] **Plugin Page Scraper** - Analyze plugin page structure and build selectors for required data fields
- [ ] **CSV Field Mapping** - Define output CSV schema based on actual plugin page data (not listing pages)
- [ ] **Aggressive Settings** - Configure scraper for 60k+ plugins with optimal concurrency/timeouts
- [ ] **Proxy Integration** - Implement rotating proxy support with provided credentials
- [ ] **Progress Tracking** - Add resumable scraping capability for 60k plugin dataset
- [ ] **Error Handling** - Robust retry logic for failed requests given large scale
- [ ] **Data Validation** - Ensure scraped data quality before CSV export

### Key Differences from Current Implementation
- No listing page parsing - direct plugin page scraping only
- SVN-based slug discovery instead of pagination
- Much larger scale (60k vs current smaller datasets)
- Requires pre-processing step (SVN download/parse)

### MVP Priorities
1. Get SVN download working with slug extraction
2. Test scraping on sample plugin pages
3. Scale up with proper proxy/concurrency settings