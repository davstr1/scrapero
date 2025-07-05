# WordPress Plugins SVN Scraper

A comprehensive scraper for WordPress.org plugins that uses SVN repository data as the source for plugin slugs. This scraper runs independently of the existing WordPress plugin scraper and is designed to handle the complete WordPress plugin directory (60,000+ plugins).

## Overview

This scraper works in three phases:
1. **Download SVN data** from WordPress.org plugins repository
2. **Extract plugin slugs** from the SVN listing
3. **Scrape individual plugin pages** for detailed information

## Features

- Resume capability for interrupted downloads and scraping
- Proxy support with automatic rotation
- Concurrent scraping with rate limiting
- Progress tracking and ETA calculation
- Comprehensive error handling and retry logic
- Extracts 28 different data fields including star rating breakdowns
- CSV output with all plugin metadata

## Installation

```bash
cd src/scrapers/wordpress-plugins-svn
npm install
```

## Usage

### Full Process (Recommended)

Run the complete scraping process:

```bash
npm run full
# or with resume capability
node index.js full --resume
```

### Individual Steps

1. **Download SVN Data**
```bash
npm run download
# Resume interrupted download
node index.js download-svn --resume
```

2. **Extract Plugin Slugs**
```bash
npm run extract
# Custom input/output
node index.js extract-slugs -i temp/svn-data.xml -o temp/plugin-slugs.csv
```

3. **Scrape Plugin Pages**
```bash
npm run scrape
# With options
node index.js scrape --resume --limit 100
```

## Configuration

Edit `config/config.json` to adjust:

- **Proxy settings**: Enable/disable proxy, set proxy URL
- **Concurrency**: Number of simultaneous requests (default: 10)
- **Rate limiting**: Requests per second
- **Timeouts**: Request and download timeouts
- **Retry settings**: Number of retries and delays
- **Selectors**: CSS selectors for data extraction

## Output Format

The scraper outputs a CSV file with the following fields:

### Primary Fields
- `name` - Plugin name
- `url` - Plugin page URL
- `author` - Plugin author
- `description` - Short description
- `rating` - Average rating (0-5)
- `ratingCount` - Total number of ratings
- `rating5Star` - Number of 5-star ratings
- `rating4Star` - Number of 4-star ratings
- `rating3Star` - Number of 3-star ratings
- `rating2Star` - Number of 2-star ratings
- `rating1Star` - Number of 1-star ratings
- `activeInstalls` - Number of active installations
- `lastUpdated` - Last update date
- `testedUpTo` - WordPress version tested up to
- `iconUrl` - Plugin icon URL
- `businessModel` - free/commercial
- `scrapedAt` - Timestamp of scraping
- `version` - Current plugin version
- `lastUpdatedDays` - Days since last update
- `downloadUrl` - Direct download link
- `requiresWP` - Minimum WordPress version
- `requiresPHP` - Minimum PHP version

### Secondary Fields
- `supportThreadsTotal` - Total support threads
- `supportThreadsResolved` - Resolved support threads
- `tags` - Plugin tags (comma-separated)
- `contributors` - List of contributors
- `homepage` - Plugin homepage URL
- `extendedDescription` - Extended description (first 1000 chars)

## File Structure

```
wordpress-plugins-svn/
├── config/
│   └── config.json         # Main configuration
├── lib/
│   ├── svn-downloader.js   # SVN data downloader
│   ├── slug-extractor.js   # Plugin slug extractor
│   ├── plugin-scraper.js   # Plugin page scraper
│   └── progress-tracker.js # Progress tracking utility
├── temp/                   # Temporary files
│   ├── svn-data.xml       # Downloaded SVN data
│   ├── plugin-slugs.csv   # Extracted slugs
│   └── *.json             # Progress files
├── output/                 # Output files
│   └── wordpress-plugins-svn.csv
├── index.js               # CLI entry point
├── package.json           # Dependencies
└── README.md             # This file
```

## Progress Tracking

The scraper maintains progress files in the `temp/` directory:
- `svn-download-progress.json` - SVN download progress
- `scrape-progress.json` - Scraping progress
- `failed-plugins.csv` - List of plugins that failed to scrape

## Error Handling

- Failed plugin scrapes are logged to `temp/failed-plugins.csv`
- Each request has configurable retry logic with exponential backoff
- Network errors and timeouts are handled gracefully
- Progress is saved periodically to allow resuming

## Performance

With default settings (10 concurrent requests):
- Processes approximately 100-200 plugins per minute
- Full 60k plugin scrape takes 5-10 hours
- SVN download depends on connection speed

## Troubleshooting

1. **SVN Download Fails**
   - Check internet connection
   - Verify SVN URL is accessible
   - Use `--resume` flag to continue

2. **Proxy Errors**
   - Verify proxy credentials and URL
   - Check proxy server status
   - Disable proxy in config if not needed

3. **Rate Limiting**
   - Reduce concurrency in config
   - Increase retry delays
   - Add longer timeouts

4. **Memory Issues**
   - Process in smaller batches using `--limit`
   - Reduce concurrency setting
   - Monitor system resources

## Notes

- This scraper is independent of the existing WordPress plugin scraper
- Designed for bulk scraping of the entire plugin directory
- Respects WordPress.org rate limits and best practices
- Proxy usage is recommended for large-scale scraping