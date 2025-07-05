# WordPress Plugins Scraper - Aggressive Configuration Review

## Configuration Changes Summary

### Previous Settings (Backed up to `config.backup.json`)
- **Max Requests**: 750
- **Concurrency**: 3
- **Timeout**: 300 seconds
- **Rate Limit**: 15 requests/minute
- **Delay Between Requests**: 4000ms (4 seconds)
- **Max Pages**: 35
- **Proxy**: Disabled

### New Aggressive Settings
- **Max Requests**: 5000 (6.7x increase)
- **Concurrency**: 10 (3.3x increase)
- **Timeout**: 600 seconds (2x increase)
- **Rate Limit**: 120 requests/minute (8x increase)
- **Delay Between Requests**: 500ms (8x faster)
- **Max Pages**: 1000 (28.6x increase)
- **Proxy**: Enabled with rotating proxy

### Proxy Configuration
- **URL**: `http://sxbrfiav:z1rnitsp7b1x@82.25.216.29:6871/`
- **Rotation**: Per request (most aggressive rotation)
- **Benefit**: IP rotation prevents rate limiting and blocking

## Actionable Checklist

- [x] Backup current configuration to `config.backup.json`
- [x] Configure rotating proxy with provided credentials
- [x] Increase max requests per crawl from 750 to 5000
- [x] Increase concurrency from 3 to 10
- [x] Increase timeout from 300s to 600s
- [x] Increase rate limit from 15 to 120 requests/minute
- [x] Decrease delay between requests from 4000ms to 500ms
- [x] Increase max pagination pages from 35 to 1000
- [x] Set proxy rotation to "request" for maximum IP variation

## Restoration Instructions

To restore previous settings if needed:
```bash
cp src/scrapers/wordpress-plugins/config.backup.json src/scrapers/wordpress-plugins/config.json
```

## Performance Impact

With these settings, the scraper will:
- Process up to 120 requests per minute (2 requests/second)
- Run 10 concurrent browser instances
- Rotate IP address on every request
- Continue scraping up to 1000 pages of plugins
- Handle up to 5000 total requests per run

This configuration is designed for comprehensive scraping of the entire WordPress plugin repository.