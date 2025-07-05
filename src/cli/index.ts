import { Command } from 'commander';
import { ScraperFactory } from '../core/ScraperFactory';
import { OutputAdapterFactory } from '../outputs/OutputAdapterFactory';
import { Logger } from '../core/Logger';
import fs from 'fs';
import path from 'path';

const program = new Command();
const logger = Logger.getInstance();

program
  .name('scraper')
  .description('Industrial-scale web scraper CLI')
  .version('1.0.0');

program
  .command('run <scraper>')
  .description('Run a specific scraper')
  .option('-e, --env <environment>', 'Environment (dev/staging/prod)', 'dev')
  .option('-u, --urls <urls...>', 'URLs to scrape')
  .option('-c, --config <config>', 'Custom config file path')
  .action(async (scraperName, options) => {
    try {
      logger.info('Starting scraper', { scraper: scraperName, env: options.env });
      
      const scraper = ScraperFactory.create(scraperName);
      
      // Load URLs from options or config
      const urls = options.urls || scraper.config.startUrls || [scraper.config.baseUrl];
      
      await scraper.run(urls);
      logger.info('Scraper completed successfully');
    } catch (error: any) {
      logger.error('Scraper failed', { error: error.message });
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available scrapers')
  .action(() => {
    const scrapers = ScraperFactory.getAvailableScrapers();
    console.log('Available scrapers:');
    scrapers.forEach(scraper => console.log(`  - ${scraper}`));
  });

program
  .command('validate <scraper>')
  .description('Validate scraper configuration')
  .action((scraperName) => {
    try {
      const configPath = `src/scrapers/${scraperName}/config.json`;
      if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found: ${configPath}`);
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Basic validation
      const required = ['name', 'baseUrl', 'selectors', 'outputs'];
      const missing = required.filter(field => !config[field]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }
      
      console.log(`✓ Configuration for '${scraperName}' is valid`);
    } catch (error: any) {
      console.error(`✗ Configuration error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('generate <name>')
  .description('Generate a new scraper template')
  .option('-t, --type <type>', 'Scraper type (playwright/cheerio)', 'playwright')
  .action(async (name, options) => {
    const scraperDir = path.join('src', 'scrapers', name);
    
    if (fs.existsSync(scraperDir)) {
      console.error(`Scraper '${name}' already exists`);
      process.exit(1);
    }
    
    // Create scraper directory structure
    fs.mkdirSync(scraperDir, { recursive: true });
    
    // Generate config template
    const configTemplate = {
      name,
      baseUrl: "https://example.com",
      crawlerType: options.type,
      selectors: {
        title: "h1",
        content: ".content"
      },
      outputs: [
        {
          type: "csv",
          enabled: true,
          config: {
            filename: `${name}-{date}.csv`,
            path: "./exports"
          }
        }
      ],
      pipeline: {
        processors: [],
        errorHandling: "continue",
        batchSize: 50
      },
      proxy: {
        enabled: false,
        rotation: "session"
      },
      rateLimit: {
        requestsPerMinute: 30,
        delayBetweenRequests: 2000
      }
    };
    
    fs.writeFileSync(
      path.join(scraperDir, 'config.json'),
      JSON.stringify(configTemplate, null, 2)
    );
    
    // Generate scraper class template
    const scraperTemplate = `import { BaseScraper } from '../base/BaseScraper';

export default class ${name.charAt(0).toUpperCase() + name.slice(1)}Scraper extends BaseScraper {
  constructor() {
    super('./src/scrapers/${name}/config.json');
  }

  setupHandlers(): Record<string, Function> {
    return {
      // Add custom handlers here
    };
  }

  async extractData(context: any): Promise<any> {
    const { page, $ } = context;
    const selectors = this.config.selectors;

    // Extract data using selectors from config
    const data = {
      title: await page?.title() || $('title').text(),
      // Add more data extraction logic here
    };

    return data;
  }
}`;
    
    fs.writeFileSync(
      path.join(scraperDir, 'index.ts'),
      scraperTemplate
    );
    
    console.log(`✓ Generated scraper '${name}' in ${scraperDir}`);
    console.log('Next steps:');
    console.log(`  1. Edit ${scraperDir}/config.json`);
    console.log(`  2. Implement data extraction in ${scraperDir}/index.ts`);
    console.log(`  3. Run: npm run scraper run ${name}`);
  });

program
  .command('outputs')
  .description('List available output adapters')
  .action(() => {
    const adapters = OutputAdapterFactory.getAvailableTypes();
    console.log('Available output adapters:');
    adapters.forEach(adapter => console.log(`  - ${adapter}`));
  });

program.parse();