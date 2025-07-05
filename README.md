# Industrial-Scale Multi-Scraper Project

A maintainable, configuration-driven web scraping system using Crawlee that can handle multiple websites with schema separation, pluggable output adapters, and industrial-scale capabilities.

## Features

- 🚀 **Industrial-Scale**: Built to handle large-scale scraping operations
- 🔧 **Configuration-Driven**: All scraping logic controlled via JSON configuration
- 🔌 **Pluggable Outputs**: Easy to add new output destinations (CSV, Database, APIs, etc.)
- 🌐 **Multi-Crawler Support**: Works with both Playwright and Cheerio
- 📊 **Data Pipeline**: Batch processing with error handling
- 🛡️ **Proxy Support**: Built-in proxy rotation capabilities
- ⚡ **Rate Limiting**: Configurable rate limiting per scraper
- 📝 **Schema Separation**: Complete separation of selectors from code

## Installation

```bash
npm install
```

## Quick Start

1. Generate a new scraper:
```bash
npm run scraper generate my-scraper
```

2. Edit the configuration:
```bash
# Edit src/scrapers/my-scraper/config.json
```

3. Run the scraper:
```bash
npm run scraper run my-scraper --urls https://example.com
```

## CLI Commands

### Run a scraper
```bash
npm run scraper run <scraper-name> [options]
  -e, --env <environment>  Environment (dev/staging/prod) 
  -u, --urls <urls...>     URLs to scrape
  -c, --config <config>    Custom config file path
```

### List available scrapers
```bash
npm run scraper list
```

### Validate scraper configuration
```bash
npm run scraper validate <scraper-name>
```

### Generate new scraper template
```bash
npm run scraper generate <name> [options]
  -t, --type <type>  Scraper type (playwright/cheerio)
```

### List available output adapters
```bash
npm run scraper outputs
```

## Configuration

### Scraper Configuration
Each scraper has its own `config.json` file with the following structure:

```json
{
  "name": "my-scraper",
  "baseUrl": "https://example.com",
  "crawlerType": "playwright",
  "selectors": {
    "title": "h1",
    "content": ".content"
  },
  "outputs": [{
    "type": "csv",
    "enabled": true,
    "config": {
      "filename": "export-{date}.csv",
      "path": "./exports"
    }
  }],
  "pipeline": {
    "processors": [],
    "errorHandling": "continue",
    "batchSize": 50
  },
  "proxy": {
    "enabled": false,
    "rotation": "session"
  },
  "rateLimit": {
    "requestsPerMinute": 30,
    "delayBetweenRequests": 2000
  }
}
```

### Output Adapters

Currently supported output adapters:
- **CSV**: Export data to CSV files
- **Database**: Save to PostgreSQL, MySQL, MongoDB

## Architecture

```
src/
├── scrapers/        # Individual scraper implementations
├── outputs/         # Output adapters and pipelines
├── core/           # Core utilities and factories
├── utils/          # Helper functions
└── cli/            # CLI interface
```

## Development

### Build the project
```bash
npm run build
```

### Run tests
```bash
npm test
```

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC