# Action Plan: WordPress SVN Plugin Scraper

## Overview
Building a NEW WordPress plugin scraper that uses SVN data as the source for plugin slugs. This runs parallel to the existing scraper.

## Step-by-Step Implementation

### Phase 1: Project Setup
- [ ] Create new directory structure at `src/scrapers/wordpress-plugins-svn/`
- [ ] Create subdirectories: `config/`, `lib/`, `output/`, `temp/`
- [ ] Copy base scraper utilities from existing WordPress scraper
- [ ] Create initial `index.js` entry point
- [ ] Create `config.json` with placeholder settings

### Phase 2: SVN Data Acquisition
- [ ] Research SVN listing format at https://plugins.svn.wordpress.org/
- [ ] Create `lib/svn-downloader.js` module
- [ ] Implement download function with progress tracking
- [ ] Add resume capability for interrupted downloads
- [ ] Store downloaded data in `temp/` directory
- [ ] Test download with timeout and size limits

### Phase 3: Slug Extraction
- [ ] Create `lib/slug-extractor.js` module
- [ ] Parse SVN data to identify plugin slug patterns
- [ ] Extract unique plugin slugs
- [ ] Create CSV writer for slug list
- [ ] Save slugs to `temp/plugin-slugs.csv`
- [ ] Add duplicate detection
- [ ] Log total slug count

### Phase 4: Plugin Page Analysis
- [ ] Visit 5-10 sample plugin pages manually
- [ ] Document page structure and available data
- [ ] Identify CSS selectors for each data field
- [ ] Compare with existing export format
- [ ] Define new CSV schema in `config/csv-schema.json`
- [ ] Create selector mapping configuration

#### Exact Field Structure and Selectors from WordPress Plugin Pages

Based on analysis of multiple plugin pages, here are the exact fields to extract:

**Primary Fields (Available in page content):**
1. **Plugin Name**: `.wp-block-post-title` or `.entry-title`
2. **Author**: Text following "By" in the header area
3. **Short Description**: First paragraph after title
4. **Rating Value**: Extract from rating display (e.g., "4.5 out of 5 stars")
5. **Rating Count**: Number inside `.wporg-ratings-stars__label` 
6. **Rating Breakdown**: Individual star counts
   - **5-star count**: `.wporg-ratings-bars__bar:nth-child(1) .wporg-ratings-bars__bar-count`
   - **4-star count**: `.wporg-ratings-bars__bar:nth-child(2) .wporg-ratings-bars__bar-count`
   - **3-star count**: `.wporg-ratings-bars__bar:nth-child(3) .wporg-ratings-bars__bar-count`
   - **2-star count**: `.wporg-ratings-bars__bar:nth-child(4) .wporg-ratings-bars__bar-count`
   - **1-star count**: `.wporg-ratings-bars__bar:nth-child(5) .wporg-ratings-bars__bar-count`
7. **Active Installs**: Text containing "million" or specific number
8. **Last Updated**: Text after "Last updated" (e.g., "4 days ago")
9. **Version**: Current plugin version number
10. **Tested Up To**: WordPress version after "Tested up to"
11. **Requires WordPress**: Version after "WordPress version"
12. **Requires PHP**: Version after "PHP version"
13. **Download URL**: Link in download button or from page data
14. **Icon URL**: Plugin icon image source

**Secondary Fields (From extended content):**
15. **Tags**: Plugin tags/categories if available (save the slugs)
16. **Homepage**: Plugin's external homepage URL
17. **Support Threads**: Total and resolved count
18. **Extended Description**: Full plugin description text

**Data Extraction Strategy:**
- Primary method: Parse HTML content and extract text patterns
- Fallback method: Use JSON-LD structured data if available
- Meta section parsing: Extract from "Version", "Last updated", etc. labels
- Rating calculation: Convert star display to numeric value

### Phase 5: Scraper Core Implementation
- [ ] Create `lib/plugin-scraper.js` module
- [ ] Implement URL builder (slug → plugin page URL)
- [ ] Add page fetching with proxy support
- [ ] Implement data extraction using selectors
- [ ] Add data validation and cleaning
- [ ] Create CSV row formatter
- [ ] Add error handling for missing data

### Phase 6: Proxy Configuration
- [ ] Update config with proxy URL: `http://sxbrfiav:z1rnitsp7b1x@82.25.216.29:6871/`
- [ ] Create proxy rotation logic
- [ ] Add proxy health checks
- [ ] Implement fallback for proxy failures
- [ ] Test proxy with sample requests

### Phase 7: Concurrency & Performance
- [ ] Implement queue system for 60k+ URLs
- [ ] Configure concurrent request limits
- [ ] Add rate limiting controls
- [ ] Implement request timeouts
- [ ] Add memory usage monitoring
- [ ] Create batch processing logic

### Phase 8: Progress & Resumability
- [ ] Create progress tracking system
- [ ] Save progress to `temp/progress.json`
- [ ] Implement resume from last position
- [ ] Add progress logging every 100 plugins
- [ ] Create estimated time remaining calculator
- [ ] Add graceful shutdown handling

### Phase 9: Error Handling & Retries
- [ ] Implement retry logic with exponential backoff
- [ ] Create failed URLs tracking
- [ ] Add specific error type handling
- [ ] Log errors to `output/errors.log`
- [ ] Create retry queue for failures
- [ ] Add maximum retry limits

### Phase 10: Output & Validation
- [ ] Create final CSV writer
- [ ] Implement data validation checks
- [ ] Add duplicate detection in output
- [ ] Create summary statistics
- [ ] Generate completion report
- [ ] Save final data to `output/wordpress-plugins-svn.csv`

### Phase 11: Testing & Optimization
- [ ] Test with 100 plugin sample
- [ ] Measure scraping speed
- [ ] Optimize selector performance
- [ ] Tune concurrency settings
- [ ] Test full resume functionality
- [ ] Verify proxy rotation

### Phase 12: Documentation & Deployment
- [ ] Create README for SVN scraper
- [ ] Document configuration options
- [ ] Add usage instructions
- [ ] Create troubleshooting guide
- [ ] Add monitoring scripts
- [ ] Test full 60k plugin run

## Success Criteria
- Successfully downloads and parses SVN data
- Extracts all available plugin slugs
- Scrapes individual plugin pages efficiently
- Handles 60k+ plugins without crashes
- Produces clean, validated CSV output
- Supports full resume capability
- Uses proxy effectively