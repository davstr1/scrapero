# Wix Roadmap Scraper

This scraper collects user feature requests from Wix's roadmap API.

## Features

- Fetches data from Wix's JSON API (no HTML parsing needed)
- Handles pagination automatically
- Deduplicates items by ID
- Maps resolution codes and label IDs to human-readable names
- Outputs data in both CSV and JSON formats
- Progress tracking and statistics

## Usage

### Test Mode (10 items)
```bash
npm test
# or
node index.js --test --limit 10
```

### Full Scrape
```bash
npm start
# or
node index.js
```

## Output

Data is saved to `data/wix-roadmap/` with timestamps:
- CSV: `wix-roadmap-YYYY-MM-DD-HHmmss.csv`
- JSON: `wix-roadmap-YYYY-MM-DD-HHmmss.json`

### Data Schema

- **id**: Unique identifier
- **title**: Feature request title
- **description**: Detailed description
- **url**: Link to full article
- **resolution**: Status (e.g., "Collecting votes", "Planned", "Launched")
- **resolutionCode**: Numeric status code
- **creationDate**: ISO date when request was created
- **categories**: Array of category names
- **categoryIds**: Original label IDs
- **readingTime**: Estimated reading time in minutes

## Statistics

The scraper provides:
- Total items scraped
- Duplicates found and removed
- Processing time
- Items per second

## Configuration

Edit `config.json` to adjust:
- Rate limiting (default: 2 requests/second)
- Output formats
- API parameters