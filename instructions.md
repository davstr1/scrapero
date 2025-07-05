# Complete Instructions: Industrial-Scale Multi-Scraper Project with Crawlee

## Project Overview
Create a maintainable, configuration-driven web scraping system using Crawlee that can handle multiple websites with schema separation, pluggable output adapters, and industrial-scale capabilities.

## Phase 1: Project Foundation Setup

### Step 1: Initialize Project Structure
```bash
mkdir scrapers-project && cd scrapers-project
npm init -y
```

### Step 2: Install Core Dependencies
```bash
# Core scraping dependencies
npm install crawlee playwright cheerio

# Database and output dependencies
npm install pg mysql2 mongodb csv-writer aws-sdk

# Development and utility dependencies
npm install -D typescript @types/node tsx nodemon
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D jest @types/jest ts-jest

# CLI and configuration utilities
npm install commander dotenv zod lodash
npm install winston date-fns
```

### Step 3: Create Project Directory Structure
```
scrapers-project/
├── src/
│   ├── scrapers/
│   │   ├── base/
│   │   │   ├── BaseScraper.ts
│   │   │   └── interfaces.ts
│   │   └── examples/
│   ├── outputs/
│   │   ├── base/
│   │   │   ├── OutputAdapter.ts
│   │   │   └── interfaces.ts
│   │   ├── adapters/
│   │   ├── processors/
│   │   └── pipelines/
│   ├── core/
│   │   ├── ConfigLoader.ts
│   │   ├── ProxyManager.ts
│   │   ├── ScraperFactory.ts
│   │   └── Logger.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── transformers.ts
│   │   └── helpers.ts
│   └── cli/
│       └── index.ts
├── configs/
│   ├── global.json
│   ├── outputs.json
│   └── environments/
│       ├── dev.json
│       ├── staging.json
│       └── prod.json
├── schemas/
└── storage/
    ├── datasets/
    ├── key-value-stores/
    └── request-queues/
```

### Step 4: Configure TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Setup Package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/cli/index.ts",
    "build": "tsc",
    "start": "node dist/cli/index.js",
    "scraper": "tsx src/cli/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

## Phase 2: Core Infrastructure

### Step 6: Create Base Interfaces
Create `src/outputs/base/interfaces.ts`:
```typescript
export interface OutputConfig {
  type: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface BatchResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors?: Error[];
}

export interface PipelineResult {
  totalProcessed: number;
  totalErrors: number;
  outputResults: Record<string, BatchResult>;
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  selectors: Record<string, string>;
  pagination?: {
    nextButtonSelector: string;
    maxPages?: number;
  };
  proxy: {
    enabled: boolean;
    rotation: 'session' | 'request';
    countries?: string[];
  };
  rateLimit: {
    requestsPerMinute: number;
    delayBetweenRequests: number;
  };
  outputs: OutputConfig[];
  pipeline: {
    processors: string[];
    errorHandling: 'continue' | 'stop';
    batchSize: number;
  };
}
```

### Step 7: Create Configuration Loader
Create `src/core/ConfigLoader.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import { ScraperConfig } from '../outputs/base/interfaces';

export class ConfigLoader {
  private static configs = new Map<string, any>();

  static load(configPath: string): ScraperConfig {
    if (this.configs.has(configPath)) {
      return this.configs.get(configPath);
    }

    const fullPath = path.resolve(configPath);
    const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Handle inheritance with "extends"
    if (config.extends) {
      const baseConfig = this.loadGlobalConfig(config.extends);
      const mergedConfig = this.mergeConfigs(baseConfig, config);
      this.configs.set(configPath, mergedConfig);
      return mergedConfig;
    }

    this.configs.set(configPath, config);
    return config;
  }

  static loadGlobalConfig(type: string): any {
    const globalPath = path.resolve(`configs/${type}.json`);
    return JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  }

  static getDbConnection(connectionName: string): any {
    const outputConfig = this.loadGlobalConfig('outputs');
    return outputConfig.database.connections[connectionName];
  }

  private static mergeConfigs(base: any, override: any): any {
    return {
      ...base,
      ...override,
      selectors: { ...base.selectors, ...override.selectors },
      proxy: { ...base.proxy, ...override.proxy },
      rateLimit: { ...base.rateLimit, ...override.rateLimit }
    };
  }
}
```

### Step 8: Create Logger Utility
Create `src/core/Logger.ts`:
```typescript
import winston from 'winston';

export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!this.instance) {
      this.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          }),
          new winston.transports.File({ filename: 'logs/scraper.log' })
        ]
      });
    }
    return this.instance;
  }

  static child(meta: object): winston.Logger {
    return this.getInstance().child(meta);
  }
}
```

## Phase 3: Output System

### Step 9: Create Base Output Adapter
Create `src/outputs/base/OutputAdapter.ts`:
```typescript
import { OutputConfig, BatchResult } from './interfaces';
import { Logger } from '../../core/Logger';

export abstract class OutputAdapter {
  protected config: OutputConfig;
  protected logger: any;

  constructor(config: OutputConfig) {
    this.config = config;
    this.logger = Logger.child({ adapter: this.constructor.name });
  }

  abstract initialize(): Promise<void>;
  abstract write(data: any[]): Promise<BatchResult>;
  abstract flush(): Promise<void>;
  abstract close(): Promise<void>;

  async validateData(data: any[]): Promise<any[]> {
    return data;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
```

### Step 10: Create CSV Output Adapter
Create `src/outputs/adapters/CSVAdapter.ts`:
```typescript
import { OutputAdapter } from '../base/OutputAdapter';
import { BatchResult } from '../base/interfaces';
import { createWriteStream, WriteStream } from 'fs';
import { format } from 'date-fns';
import path from 'path';

export class CSVAdapter extends OutputAdapter {
  private writeStream: WriteStream;
  private filePath: string;
  private headerWritten = false;

  async initialize(): Promise<void> {
    this.filePath = this.resolveFilePath();
    
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    this.writeStream = createWriteStream(this.filePath, { 
      encoding: this.config.config.encoding || 'utf8' 
    });
    
    this.logger.info('CSV adapter initialized', { filePath: this.filePath });
  }

  async write(data: any[]): Promise<BatchResult> {
    if (!data.length) return { success: true, processedCount: 0, errorCount: 0 };

    try {
      // Write headers if first batch
      if (!this.headerWritten && this.config.config.headers !== false) {
        const headers = Object.keys(data[0]);
        this.writeStream.write(headers.join(this.config.config.delimiter || ',') + '\n');
        this.headerWritten = true;
      }

      // Write data rows
      for (const row of data) {
        const values = Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        );
        this.writeStream.write(values.join(this.config.config.delimiter || ',') + '\n');
      }

      return {
        success: true,
        processedCount: data.length,
        errorCount: 0
      };
    } catch (error) {
      this.logger.error('CSV write failed', { error });
      return {
        success: false,
        processedCount: 0,
        errorCount: data.length,
        errors: [error]
      };
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.writeStream.once('drain', resolve);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.writeStream.end(resolve);
    });
  }

  private resolveFilePath(): string {
    let filename = this.config.config.filename || 'export-{timestamp}.csv';
    
    filename = filename
      .replace('{date}', format(new Date(), 'yyyy-MM-dd'))
      .replace('{timestamp}', Date.now().toString())
      .replace('{scraper}', this.config.config.scraperName || 'unknown');
    
    return path.join(this.config.config.path || './exports', filename);
  }
}
```

### Step 11: Create Database Output Adapter
Create `src/outputs/adapters/DatabaseAdapter.ts`:
```typescript
import { OutputAdapter } from '../base/OutputAdapter';
import { BatchResult } from '../base/interfaces';
import { ConfigLoader } from '../../core/ConfigLoader';
import { Pool } from 'pg'; // PostgreSQL example

export class DatabaseAdapter extends OutputAdapter {
  private db: Pool;
  private tableName: string;

  async initialize(): Promise<void> {
    const connConfig = ConfigLoader.getDbConnection(this.config.config.connection);
    
    this.db = new Pool({
      host: connConfig.host,
      port: connConfig.port,
      database: connConfig.database,
      user: connConfig.user,
      password: connConfig.password,
      ...connConfig.pool
    });
    
    this.tableName = this.config.config.table;
    
    // Test connection
    await this.db.query('SELECT 1');
    this.logger.info('Database adapter initialized', { table: this.tableName });

    // Auto-create table if needed
    if (this.config.config.autoCreateTable) {
      await this.ensureTable();
    }
  }

  async write(data: any[]): Promise<BatchResult> {
    if (!data.length) return { success: true, processedCount: 0, errorCount: 0 };

    const batchSize = this.config.config.batchSize || 100;
    const results: BatchResult = {
      success: true,
      processedCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        if (this.config.config.upsert) {
          await this.upsertBatch(batch);
        } else {
          await this.insertBatch(batch);
        }
        results.processedCount += batch.length;
      } catch (error) {
        results.success = false;
        results.errorCount += batch.length;
        results.errors?.push(error);
        this.logger.error('Database batch write failed', { error, batchSize: batch.length });
      }
    }

    return results;
  }

  private async insertBatch(data: any[]): Promise<void> {
    const columns = Object.keys(data[0]);
    const placeholders = data.map((_, i) => 
      `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
    ).join(', ');
    
    const values = data.flatMap(row => columns.map(col => row[col]));
    const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
    
    await this.db.query(query, values);
  }

  private async upsertBatch(data: any[]): Promise<void> {
    // Implementation depends on database type and conflict resolution strategy
    const columns = Object.keys(data[0]);
    const conflictColumn = this.config.config.conflictColumn || 'id';
    
    for (const row of data) {
      const updateSet = columns
        .filter(col => col !== conflictColumn)
        .map(col => `${col} = EXCLUDED.${col}`)
        .join(', ');
        
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => row[col]);
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')}) 
        VALUES (${placeholders})
        ON CONFLICT (${conflictColumn}) 
        DO UPDATE SET ${updateSet}
      `;
      
      await this.db.query(query, values);
    }
  }

  async flush(): Promise<void> {
    // PostgreSQL doesn't need explicit flush
  }

  async close(): Promise<void> {
    await this.db.end();
  }

  private async ensureTable(): Promise<void> {
    // This is a basic implementation - in production, use proper migrations
    const schema = this.config.config.schema;
    if (schema) {
      const createTableQuery = this.generateCreateTableQuery(schema);
      await this.db.query(createTableQuery);
    }
  }

  private generateCreateTableQuery(schema: any): string {
    // Generate CREATE TABLE IF NOT EXISTS query from schema
    // This is simplified - implement based on your schema format
    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (id SERIAL PRIMARY KEY)`;
  }
}
```

### Step 12: Create Output Adapter Factory
Create `src/outputs/OutputAdapterFactory.ts`:
```typescript
import { OutputAdapter } from './base/OutputAdapter';
import { OutputConfig } from './base/interfaces';
import { CSVAdapter } from './adapters/CSVAdapter';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';

export class OutputAdapterFactory {
  private static adapters = new Map<string, typeof OutputAdapter>([
    ['csv', CSVAdapter],
    ['database', DatabaseAdapter],
    // Add more adapters here
  ]);

  static register(type: string, adapterClass: typeof OutputAdapter): void {
    this.adapters.set(type, adapterClass);
  }

  static create(config: OutputConfig): OutputAdapter {
    const AdapterClass = this.adapters.get(config.type);
    if (!AdapterClass) {
      throw new Error(`Unknown output adapter: ${config.type}`);
    }
    return new AdapterClass(config);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}
```

## Phase 4: Pipeline System

### Step 13: Create Data Pipeline
Create `src/outputs/pipelines/Pipeline.ts`:
```typescript
import { OutputAdapter } from '../base/OutputAdapter';
import { PipelineResult, BatchResult } from '../base/interfaces';
import { Logger } from '../../core/Logger';

export class Pipeline {
  private logger = Logger.child({ component: 'Pipeline' });

  constructor(
    private outputs: OutputAdapter[],
    private batchSize: number = 50
  ) {}

  async initialize(): Promise<void> {
    await Promise.all(this.outputs.map(output => output.initialize()));
    this.logger.info('Pipeline initialized', { outputCount: this.outputs.length });
  }

  async process(data: any[]): Promise<PipelineResult> {
    if (!data.length) {
      return { totalProcessed: 0, totalErrors: 0, outputResults: {} };
    }

    // Process in batches
    const results: Record<string, BatchResult> = {};
    let totalProcessed = 0;
    let totalErrors = 0;

    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      
      // Write to all outputs in parallel
      const outputPromises = this.outputs.map(async (output, index) => {
        try {
          const result = await output.write(batch);
          results[`output_${index}`] = result;
          return result;
        } catch (error) {
          this.logger.error('Output write failed', { error, outputIndex: index });
          const errorResult: BatchResult = {
            success: false,
            processedCount: 0,
            errorCount: batch.length,
            errors: [error]
          };
          results[`output_${index}`] = errorResult;
          return errorResult;
        }
      });

      const batchResults = await Promise.all(outputPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        totalProcessed += result.processedCount;
        totalErrors += result.errorCount;
      });
    }

    return {
      totalProcessed,
      totalErrors,
      outputResults: results
    };
  }

  async close(): Promise<void> {
    await Promise.all(this.outputs.map(output => output.close()));
    this.logger.info('Pipeline closed');
  }
}
```

### Step 14: Create Pipeline Builder
Create `src/outputs/pipelines/PipelineBuilder.ts`:
```typescript
import { Pipeline } from './Pipeline';
import { OutputAdapter } from '../base/OutputAdapter';
import { OutputAdapterFactory } from '../OutputAdapterFactory';
import { ScraperConfig } from '../base/interfaces';

export class PipelineBuilder {
  private outputs: OutputAdapter[] = [];

  addOutput(adapter: OutputAdapter): this {
    this.outputs.push(adapter);
    return this;
  }

  build(batchSize?: number): Pipeline {
    return new Pipeline(this.outputs, batchSize);
  }

  static fromConfig(config: ScraperConfig): Pipeline {
    const builder = new PipelineBuilder();
    
    // Add outputs based on config
    config.outputs?.forEach(outputConfig => {
      if (outputConfig.enabled) {
        // Inject scraper name into output config
        outputConfig.config.scraperName = config.name;
        
        const adapter = OutputAdapterFactory.create(outputConfig);
        builder.addOutput(adapter);
      }
    });

    return builder.build(config.pipeline.batchSize);
  }
}
```

## Phase 5: Scraper Base Classes

### Step 15: Create Base Scraper
Create `src/scrapers/base/BaseScraper.ts`:
```typescript
import { PlaywrightCrawler, CheerioCrawler } from 'crawlee';
import { ConfigLoader } from '../../core/ConfigLoader';
import { PipelineBuilder } from '../../outputs/pipelines/PipelineBuilder';
import { Pipeline } from '../../outputs/pipelines/Pipeline';
import { ScraperConfig } from '../../outputs/base/interfaces';
import { Logger } from '../../core/Logger';

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected pipeline: Pipeline;
  protected crawler: PlaywrightCrawler | CheerioCrawler;
  protected logger: any;

  constructor(configPath: string) {
    this.config = ConfigLoader.load(configPath);
    this.logger = Logger.child({ scraper: this.config.name });
    this.setupPipeline();
  }

  abstract setupHandlers(): Record<string, Function>;
  abstract extractData(context: any): Promise<any>;

  protected async setupPipeline(): Promise<void> {
    this.pipeline = PipelineBuilder.fromConfig(this.config);
    await this.pipeline.initialize();
  }

  protected setupCrawler(): void {
    const handlers = this.setupHandlers();
    
    // Choose crawler type based on config or default to Playwright
    const crawlerType = this.config.crawlerType || 'playwright';
    
    if (crawlerType === 'playwright') {
      this.crawler = new PlaywrightCrawler({
        requestHandler: async (context) => {
          const data = await this.extractData(context);
          if (data) {
            await this.pipeline.process([data]);
          }
        },
        maxRequestsPerCrawl: this.config.maxRequestsPerCrawl || 100,
        requestHandlerTimeoutSecs: 60,
        ...this.getProxyConfig(),
        ...this.getRateLimitConfig()
      });
    } else {
      this.crawler = new CheerioCrawler({
        requestHandler: async (context) => {
          const data = await this.extractData(context);
          if (data) {
            await this.pipeline.process([data]);
          }
        },
        maxRequestsPerCrawl: this.config.maxRequestsPerCrawl || 100,
        ...this.getProxyConfig(),
        ...this.getRateLimitConfig()
      });
    }
  }

  async run(urls: string[]): Promise<void> {
    this.setupCrawler();
    
    this.logger.info('Starting scraper', { 
      urls: urls.length, 
      scraper: this.config.name 
    });
    
    try {
      await this.crawler.run(urls);
      this.logger.info('Scraper completed successfully');
    } catch (error) {
      this.logger.error('Scraper failed', { error });
      throw error;
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    await this.pipeline.close();
  }

  private getProxyConfig(): any {
    if (!this.config.proxy.enabled) return {};
    
    // Implement proxy configuration based on your proxy service
    return {
      proxyConfiguration: {
        // Add proxy configuration here
      }
    };
  }

  private getRateLimitConfig(): any {
    return {
      maxRequestsPerMinute: this.config.rateLimit.requestsPerMinute,
      requestHandlerTimeoutSecs: 60
    };
  }
}
```

### Step 16: Create Scraper Factory
Create `src/core/ScraperFactory.ts`:
```typescript
import { BaseScraper } from '../scrapers/base/BaseScraper';
import fs from 'fs';
import path from 'path';

export class ScraperFactory {
  private static scrapers = new Map<string, () => BaseScraper>();

  static register(name: string, scraperFactory: () => BaseScraper): void {
    this.scrapers.set(name, scraperFactory);
  }

  static create(scraperName: string): BaseScraper {
    const scraperFactory = this.scrapers.get(scraperName);
    if (scraperFactory) {
      return scraperFactory();
    }

    // Try to dynamically load scraper
    const scraperPath = path.join(process.cwd(), 'src', 'scrapers', scraperName);
    if (fs.existsSync(`${scraperPath}/index.ts`)) {
      const scraperModule = require(`${scraperPath}/index.ts`);
      const ScraperClass = scraperModule.default || scraperModule[Object.keys(scraperModule)[0]];
      return new ScraperClass();
    }

    throw new Error(`Scraper '${scraperName}' not found`);
  }

  static getAvailableScrapers(): string[] {
    const scrapersDir = path.join(process.cwd(), 'src', 'scrapers');
    if (!fs.existsSync(scrapersDir)) return [];

    return fs.readdirSync(scrapersDir)
      .filter(item => {
        const itemPath = path.join(scrapersDir, item);
        return fs.statSync(itemPath).isDirectory() && 
               item !== 'base' && 
               fs.existsSync(path.join(itemPath, 'index.ts'));
      });
  }
}
```

## Phase 6: CLI Interface

### Step 17: Create CLI
Create `src/cli/index.ts`:
```typescript
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
      const urls = options.urls || ['https://example.com'];
      
      await scraper.run(urls);
      logger.info('Scraper completed successfully');
    } catch (error) {
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
    } catch (error) {
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
```

## Phase 7: Configuration Files

### Step 18: Create Global Configuration
Create `configs/global.json`:
```json
{
  "defaultProxy": {
    "enabled": false,
    "rotation": "session",
    "timeout": 30000
  },
  "defaultRateLimit": {
    "requestsPerMinute": 30,
    "delayBetweenRequests": 2000
  },
  "storage": {
    "baseDir": "./storage",
    "retention": "30d"
  },
  "crawlerType": "playwright",
  "maxRequestsPerCrawl": 100
}
```

Create `configs/outputs.json`:
```json
{
  "database": {
    "connections": {
      "primary": {
        "type": "postgresql",
        "host": "localhost",
        "port": 5432,
        "database": "scrapers",
        "user": "scraper_user",
        "password": "scraper_pass",
        "pool": {
          "min": 2,
          "max": 10
        }
      }
    }
  },
  "csv": {
    "defaults": {
      "encoding": "utf8",
      "delimiter": ",",
      "headers": true
    }
  }
}
```

### Step 19: Create Environment Configurations
Create `configs/environments/dev.json`:
```json
{
  "proxy": {
    "enabled": false
  },
  "rateLimit": {
    "requestsPerMinute": 60
  },
  "maxRequestsPerCrawl": 10
}
```

Create `configs/environments/prod.json`:
```json
{
  "proxy": {
    "enabled": true,
    "rotation": "request",
    "countries": ["US", "GB", "DE"]
  },
  "rateLimit": {
    "requestsPerMinute": 10
  },
  "maxRequestsPerCrawl": 1000
}
```

## Phase 8: Example Scraper

### Step 20: Create Example Scraper
Create a sample scraper using the generate command:
```bash
npm run scraper generate books-to-scrape
```

Then customize `src/scrapers/books-to-scrape/config.json`:
```json
{
  "extends": "global",
  "name": "books-to-scrape",
  "baseUrl": "https://books.toscrape.com",
  "selectors": {
    "title": "h1",
    "price": ".price_color",
    "rating": ".star-rating",
    "availability": ".availability",
    "description": "#product_description + p"
  },
  "pagination": {
    "nextButtonSelector": ".next a",
    "maxPages": 5
  },
  "outputs": [
    {
      "type": "csv",
      "enabled": true,
      "config": {
        "filename": "books-{date}.csv",
        "path": "./exports",
        "headers": true
      }
    },
    {
      "type": "database",
      "enabled": false,
      "config": {
        "table": "books",
        "connection": "primary",
        "upsert": true,
        "batchSize": 50
      }
    }
  ],
  "pipeline": {
    "processors": ["validation"],
    "errorHandling": "continue",
    "batchSize": 25
  }
}
```

## Phase 9: Testing and Documentation

### Step 21: Create Tests
Create basic test structure and example tests for core components.

### Step 22: Create Documentation
Create README.md with:
- Installation instructions
- Configuration guide
- Usage examples
- API documentation
- Contributing guidelines

## Phase 10: Final Setup

### Step 23: Environment Variables
Create `.env.example`:
```
NODE_ENV=development
LOG_LEVEL=info
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scrapers
DB_USER=scraper_user
DB_PASSWORD=scraper_pass
```

### Step 24: Git Configuration
Create `.gitignore`:
```
node_modules/
dist/
.env
logs/
exports/
storage/
*.log
```

### Step 25: Build and Test
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Generate example scraper
npm run scraper generate example-site

# Run the example scraper
npm run scraper run example-site --urls "https://example.com"

# List available scrapers
npm run scraper list

# Validate configuration
npm run scraper validate example-site
```

## Summary

This creates a complete, industrial-scale web scraping system with:

1. **Maintainable Architecture**: Clean separation of concerns with modular design
2. **Configuration-Driven**: All scraping logic controlled via JSON configuration
3. **Pluggable Outputs**: Easy to add new output destinations (CSV, Database, APIs, etc.)
4. **Industrial Features**: Proxy support, rate limiting, error handling, logging
5. **CLI Management**: Easy operation and monitoring via command line
6. **Schema Separation**: Complete separation of selectors from code
7. **Scalable Design**: Can handle multiple scrapers and large-scale operations
8. **LLM-Friendly**: Well-documented, consistent patterns for easy understanding

The system is designed for maximum maintainability and allows adding new scrapers by simply creating configuration files and minimal implementation code.