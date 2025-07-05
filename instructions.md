# Production-Ready Web Scraping System with Crawlee

## Overview
Build a maintainable, scalable web scraping system using modern TypeScript patterns:
- **Type-safe configuration** with Zod validation
- **Modular architecture** with clear separation of concerns  
- **Plugin-based outputs** for easy extensibility
- **Production features** built-in (monitoring, error handling, retries)

## Quick Start

### 1. Project Setup
```bash
# Initialize project with TypeScript
npm init -y
npm install -D typescript @types/node tsx nodemon

# Core dependencies
npm install crawlee playwright cheerio zod neverthrow \
  winston date-fns dotenv commander

# Database drivers (install what you need)
npm install pg mysql2 mongodb  # Choose based on your needs
npm install @aws-sdk/client-s3  # For S3 storage

# Development tools
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  prettier eslint-config-prettier eslint-plugin-prettier \
  jest @types/jest ts-jest
```

### 2. Project Structure
```bash
# Create all directories
mkdir -p src/scrapers src/outputs src/core src/utils src/cli \
  src/types configs tests/unit tests/integration tests/fixtures \
  storage exports logs docs
```

```
src/
├── core/           # Core functionality
│   ├── config.ts   # Configuration with Zod schemas
│   ├── logger.ts   # Structured logging
│   ├── errors.ts   # Error types and handling
│   └── types.ts    # Shared TypeScript types
├── scrapers/       # Scraper implementations
│   ├── base.ts     # Base scraper with composition
│   └── */          # Individual scrapers
├── outputs/        # Output adapters
│   ├── base.ts     # Output interface
│   ├── csv.ts      # CSV writer
│   ├── database.ts # Database writer
│   └── s3.ts       # S3 uploader
├── utils/          # Utilities
│   ├── retry.ts    # Retry logic
│   ├── validate.ts # Data validation
│   └── transform.ts # Data transformations
└── cli/            # CLI interface
    └── index.ts    # Command definitions
```

### 3. TypeScript Configuration
**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

### 4. Package Scripts
**package.json**
```json
{
  "scripts": {
    "dev": "tsx watch src/cli/index.ts",
    "build": "tsc",
    "start": "node dist/cli/index.js",
    "scraper": "tsx src/cli/index.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint && npm run test",
    "clean": "rm -rf dist coverage"
  }
}
```

### 5. Jest Configuration
**jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

## Core Implementation

### 1. Type-Safe Configuration
**src/core/config.ts**
```typescript
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define schemas for type safety and validation
export const SelectorSchema = z.record(z.string());

export const PaginationSchema = z.object({
  nextButtonSelector: z.string().optional(),
  maxPages: z.number().positive().optional(),
  waitBetweenPages: z.number().default(1000)
});

export const RateLimitSchema = z.object({
  requestsPerMinute: z.number().positive().default(30),
  concurrent: z.number().positive().default(1)
});

export const OutputConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('csv'),
    enabled: z.boolean().default(true),
    options: z.object({
      path: z.string(),
      headers: z.boolean().default(true),
      delimiter: z.string().default(',')
    })
  }),
  z.object({
    type: z.literal('database'),
    enabled: z.boolean().default(true),
    options: z.object({
      connection: z.string(),
      table: z.string(),
      upsert: z.boolean().default(false),
      batchSize: z.number().default(100)
    })
  }),
  z.object({
    type: z.literal('s3'),
    enabled: z.boolean().default(true),
    options: z.object({
      bucket: z.string(),
      keyPrefix: z.string(),
      format: z.enum(['json', 'csv']).default('json')
    })
  })
]);

export const ScraperConfigSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  crawlerType: z.enum(['playwright', 'cheerio']).default('cheerio'),
  selectors: SelectorSchema,
  pagination: PaginationSchema.optional(),
  rateLimit: RateLimitSchema,
  outputs: z.array(OutputConfigSchema),
  retries: z.object({
    maxAttempts: z.number().default(3),
    backoff: z.enum(['exponential', 'linear']).default('exponential')
  }).default({})
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

// Config loader with validation
export class ConfigLoader {
  static async load(configPath: string): Promise<Result<ScraperConfig, Error>> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const rawConfig = JSON.parse(content);
      
      const result = ScraperConfigSchema.safeParse(rawConfig);
      if (!result.success) {
        return err(new Error(`Invalid config: ${result.error.message}`));
      }
      
      return ok(result.data);
    } catch (error) {
      return err(new Error(`Failed to load config: ${error}`));
    }
  }
  
  static async loadAll(dir: string): Promise<Result<ScraperConfig[], Error>> {
    try {
      const files = await fs.readdir(dir);
      const configs: ScraperConfig[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const result = await this.load(path.join(dir, file));
          if (result.isOk()) {
            configs.push(result.value);
          }
        }
      }
      
      return ok(configs);
    } catch (error) {
      return err(new Error(`Failed to load configs: ${error}`));
    }
  }
}
```

### 2. Error Handling with Result Types
**src/core/errors.ts**
```typescript
import { Result, ok, err } from 'neverthrow';

export class ScraperError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

export const ErrorCodes = {
  CONFIG_INVALID: 'CONFIG_INVALID',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  OUTPUT_FAILED: 'OUTPUT_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// Utility functions for error handling
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorCode: string
): Promise<Result<T, ScraperError>> {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    return err(new ScraperError(
      error instanceof Error ? error.message : String(error),
      errorCode,
      { originalError: error }
    ));
  }
}

export function aggregateErrors(
  results: Result<any, Error>[]
): Result<any[], Error> {
  const errors = results.filter(r => r.isErr());
  if (errors.length > 0) {
    const messages = errors.map(e => e.error.message).join('; ');
    return err(new Error(`Multiple errors: ${messages}`));
  }
  return ok(results.map(r => r.value));
}
```

### 3. Enhanced Logger
**src/core/logger.ts**
```typescript
import winston from 'winston';

export class Logger {
  private static instances = new Map<string, winston.Logger>();
  
  static create(name: string, meta?: Record<string, any>): winston.Logger {
    if (!this.instances.has(name)) {
      const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        defaultMeta: { service: name, ...meta },
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          }),
          new winston.transports.File({
            filename: `logs/${name}-error.log`,
            level: 'error'
          }),
          new winston.transports.File({
            filename: `logs/${name}.log`
          })
        ]
      });
      
      this.instances.set(name, logger);
    }
    
    return this.instances.get(name)!;
  }
  
  static child(parent: winston.Logger, meta: Record<string, any>): winston.Logger {
    return parent.child(meta);
  }
}
```

### 4. Base Scraper with Composition
**src/scrapers/base.ts**
```typescript
import { PlaywrightCrawler, CheerioCrawler, Dataset } from 'crawlee';
import { Result, ok, err } from 'neverthrow';
import winston from 'winston';
import { ScraperConfig } from '../core/config';
import { Logger } from '../core/logger';
import { ScraperError, ErrorCodes, tryCatch } from '../core/errors';
import { OutputManager } from '../outputs/manager';
import { RetryManager } from '../utils/retry';

export interface ScraperComponents {
  config: ScraperConfig;
  logger: winston.Logger;
  outputManager: OutputManager;
  retryManager: RetryManager;
}

export abstract class BaseScraper {
  protected crawler: PlaywrightCrawler | CheerioCrawler;
  protected logger: winston.Logger;
  protected outputManager: OutputManager;
  protected retryManager: RetryManager;
  
  constructor(protected components: ScraperComponents) {
    this.logger = components.logger;
    this.outputManager = components.outputManager;
    this.retryManager = components.retryManager;
    this.setupCrawler();
  }
  
  abstract extractData(context: any): Promise<Result<any, ScraperError>>;
  
  protected setupCrawler(): void {
    const { config } = this.components;
    
    const crawlerOptions = {
      maxRequestsPerCrawl: config.rateLimit.requestsPerMinute,
      maxConcurrency: config.rateLimit.concurrent,
      requestHandlerTimeoutSecs: 60,
      requestHandler: this.createRequestHandler()
    };
    
    if (config.crawlerType === 'playwright') {
      this.crawler = new PlaywrightCrawler(crawlerOptions);
    } else {
      this.crawler = new CheerioCrawler(crawlerOptions);
    }
  }
  
  protected createRequestHandler() {
    return async (context: any) => {
      const { request } = context;
      this.logger.info('Processing page', { url: request.url });
      
      // Extract data with retry
      const result = await this.retryManager.retry(
        () => this.extractData(context),
        { maxAttempts: this.components.config.retries.maxAttempts }
      );
      
      if (result.isErr()) {
        this.logger.error('Failed to extract data', {
          url: request.url,
          error: result.error
        });
        return;
      }
      
      // Process through output manager
      const outputResult = await this.outputManager.process(result.value);
      if (outputResult.isErr()) {
        this.logger.error('Failed to output data', {
          error: outputResult.error
        });
      }
    };
  }
  
  async run(urls: string[]): Promise<Result<void, Error>> {
    try {
      await this.outputManager.initialize();
      await this.crawler.run(urls);
      await this.outputManager.finalize();
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Scraper failed: ${error}`));
    }
  }
}
```

### 5. Output Manager
**src/outputs/manager.ts**
```typescript
import { Result, ok, err } from 'neverthrow';
import { OutputAdapter } from './base';
import { CSVOutput } from './csv';
import { DatabaseOutput } from './database';
import { S3Output } from './s3';
import { ScraperConfig, OutputConfigSchema } from '../core/config';
import { aggregateErrors } from '../core/errors';

export class OutputManager {
  private outputs: OutputAdapter[] = [];
  private buffer: any[] = [];
  private batchSize = 100;
  
  constructor(private config: ScraperConfig) {
    this.setupOutputs();
  }
  
  private setupOutputs(): void {
    for (const outputConfig of this.config.outputs) {
      if (!outputConfig.enabled) continue;
      
      switch (outputConfig.type) {
        case 'csv':
          this.outputs.push(new CSVOutput(outputConfig.options));
          break;
        case 'database':
          this.outputs.push(new DatabaseOutput(outputConfig.options));
          break;
        case 's3':
          this.outputs.push(new S3Output(outputConfig.options));
          break;
      }
    }
  }
  
  async initialize(): Promise<Result<void, Error>> {
    const results = await Promise.all(
      this.outputs.map(output => output.initialize())
    );
    return aggregateErrors(results).map(() => undefined);
  }
  
  async process(data: any): Promise<Result<void, Error>> {
    this.buffer.push(data);
    
    if (this.buffer.length >= this.batchSize) {
      return this.flush();
    }
    
    return ok(undefined);
  }
  
  async flush(): Promise<Result<void, Error>> {
    if (this.buffer.length === 0) return ok(undefined);
    
    const batch = [...this.buffer];
    this.buffer = [];
    
    const results = await Promise.all(
      this.outputs.map(output => output.write(batch))
    );
    
    return aggregateErrors(results).map(() => undefined);
  }
  
  async finalize(): Promise<Result<void, Error>> {
    await this.flush();
    
    const results = await Promise.all(
      this.outputs.map(output => output.close())
    );
    
    return aggregateErrors(results).map(() => undefined);
  }
}
```

### 6. Output Adapters
**src/outputs/base.ts**
```typescript
import { Result } from 'neverthrow';

export interface OutputAdapter {
  initialize(): Promise<Result<void, Error>>;
  write(data: any[]): Promise<Result<void, Error>>;
  close(): Promise<Result<void, Error>>;
}
```

**src/outputs/csv.ts**
```typescript
import { createWriteStream, WriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { Result, ok, err } from 'neverthrow';
import { OutputAdapter } from './base';
import { tryCatch } from '../core/errors';

interface CSVOptions {
  path: string;
  headers: boolean;
  delimiter: string;
}

export class CSVOutput implements OutputAdapter {
  private stream?: WriteStream;
  private headerWritten = false;
  
  constructor(private options: CSVOptions) {}
  
  async initialize(): Promise<Result<void, Error>> {
    // Ensure directory exists
    await mkdir(dirname(this.options.path), { recursive: true });
    
    return tryCatch(async () => {
      this.stream = createWriteStream(this.options.path);
    }, 'OUTPUT_FAILED');
  }
  
  async write(data: any[]): Promise<Result<void, Error>> {
    if (!this.stream || data.length === 0) {
      return ok(undefined);
    }
    
    try {
      // Write headers on first batch
      if (this.options.headers && !this.headerWritten) {
        const headers = Object.keys(data[0]).join(this.options.delimiter);
        this.stream.write(headers + '\n');
        this.headerWritten = true;
      }
      
      // Write data rows
      for (const row of data) {
        const values = Object.values(row)
          .map(v => this.escapeValue(String(v)))
          .join(this.options.delimiter);
        this.stream.write(values + '\n');
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new Error(`CSV write failed: ${error}`));
    }
  }
  
  async close(): Promise<Result<void, Error>> {
    return new Promise((resolve) => {
      if (!this.stream) {
        resolve(ok(undefined));
        return;
      }
      
      this.stream.end(() => resolve(ok(undefined)));
    });
  }
  
  private escapeValue(value: string): string {
    if (value.includes(this.options.delimiter) || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
```

### 7. Retry Manager
**src/utils/retry.ts**
```typescript
import { Result, ok, err } from 'neverthrow';

interface RetryOptions {
  maxAttempts: number;
  backoff?: 'exponential' | 'linear';
  initialDelay?: number;
}

export class RetryManager {
  async retry<T>(
    fn: () => Promise<Result<T, Error>>,
    options: RetryOptions
  ): Promise<Result<T, Error>> {
    const { maxAttempts, backoff = 'exponential', initialDelay = 1000 } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await fn();
      
      if (result.isOk()) {
        return result;
      }
      
      if (attempt < maxAttempts) {
        const delay = backoff === 'exponential' 
          ? initialDelay * Math.pow(2, attempt - 1)
          : initialDelay * attempt;
          
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return err(new Error(`Failed after ${maxAttempts} attempts`));
  }
}
```

### 8. CLI Interface
**src/cli/index.ts**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigLoader } from '../core/config';
import { Logger } from '../core/logger';
import { ScraperFactory } from '../scrapers/factory';

const program = new Command();
const logger = Logger.create('cli');

program
  .name('scraper')
  .description('Production-ready web scraper')
  .version('1.0.0');

program
  .command('run <scraper>')
  .description('Run a specific scraper')
  .option('-u, --urls <urls...>', 'URLs to scrape')
  .option('-c, --config <path>', 'Config file path')
  .action(async (scraperName, options) => {
    try {
      // Load configuration
      const configPath = options.config || `configs/${scraperName}.json`;
      const configResult = await ConfigLoader.load(configPath);
      
      if (configResult.isErr()) {
        logger.error('Failed to load config', { error: configResult.error });
        process.exit(1);
      }
      
      // Create and run scraper
      const scraper = ScraperFactory.create(scraperName, configResult.value);
      const urls = options.urls || [configResult.value.baseUrl];
      
      const result = await scraper.run(urls);
      if (result.isErr()) {
        logger.error('Scraping failed', { error: result.error });
        process.exit(1);
      }
      
      logger.info('Scraping completed successfully');
    } catch (error) {
      logger.error('Unexpected error', { error });
      process.exit(1);
    }
  });

program
  .command('validate <config>')
  .description('Validate scraper configuration')
  .action(async (configPath) => {
    const result = await ConfigLoader.load(configPath);
    
    if (result.isErr()) {
      console.error('❌ Invalid configuration:', result.error.message);
      process.exit(1);
    }
    
    console.log('✅ Configuration is valid');
    console.log(JSON.stringify(result.value, null, 2));
  });

program
  .command('list')
  .description('List available scrapers')
  .action(async () => {
    const result = await ConfigLoader.loadAll('./configs');
    
    if (result.isOk()) {
      console.log('Available scrapers:');
      result.value.forEach(config => {
        console.log(`  - ${config.name}: ${config.baseUrl}`);
      });
    }
  });

program.parse();
```

## Example Scraper Implementation

### 1. Create Configuration
**configs/books.json**
```json
{
  "name": "books-scraper",
  "baseUrl": "https://books.toscrape.com",
  "crawlerType": "cheerio",
  "selectors": {
    "title": "h1",
    "price": ".price_color",
    "availability": ".availability",
    "rating": ".star-rating",
    "description": "#product_description + p"
  },
  "pagination": {
    "nextButtonSelector": ".next a",
    "maxPages": 5
  },
  "rateLimit": {
    "requestsPerMinute": 30,
    "concurrent": 2
  },
  "outputs": [
    {
      "type": "csv",
      "enabled": true,
      "options": {
        "path": "./exports/books.csv",
        "headers": true,
        "delimiter": ","
      }
    },
    {
      "type": "database",
      "enabled": false,
      "options": {
        "connection": "postgres://localhost/scrapers",
        "table": "books",
        "upsert": true
      }
    }
  ],
  "retries": {
    "maxAttempts": 3,
    "backoff": "exponential"
  }
}
```

### 2. Implement Scraper
**src/scrapers/books/index.ts**
```typescript
import { Result, ok, err } from 'neverthrow';
import { BaseScraper } from '../base';
import { ScraperError, ErrorCodes } from '../../core/errors';

export class BooksScraper extends BaseScraper {
  async extractData(context: any): Promise<Result<any, ScraperError>> {
    const { $ } = context; // Cheerio instance
    const { selectors } = this.components.config;
    
    try {
      const data: Record<string, any> = {};
      
      // Extract data using selectors
      for (const [key, selector] of Object.entries(selectors)) {
        const element = $(selector);
        if (element.length === 0) {
          this.logger.warn(`Selector not found: ${key}`, { selector });
          continue;
        }
        
        // Special handling for rating
        if (key === 'rating') {
          const classes = element.attr('class') || '';
          const match = classes.match(/star-rating (\w+)/);
          data[key] = match ? match[1] : null;
        } else {
          data[key] = element.text().trim();
        }
      }
      
      // Parse price
      if (data.price) {
        data.price = parseFloat(data.price.replace(/[£$]/, ''));
      }
      
      // Add metadata
      data.url = context.request.url;
      data.scrapedAt = new Date().toISOString();
      
      return ok(data);
    } catch (error) {
      return err(new ScraperError(
        `Failed to extract data: ${error}`,
        ErrorCodes.SELECTOR_NOT_FOUND,
        { url: context.request.url }
      ));
    }
  }
}
```

### 3. Register in Factory
**src/scrapers/factory.ts**
```typescript
import { ScraperConfig } from '../core/config';
import { BaseScraper, ScraperComponents } from './base';
import { BooksScraper } from './books';
import { Logger } from '../core/logger';
import { OutputManager } from '../outputs/manager';
import { RetryManager } from '../utils/retry';

export class ScraperFactory {
  private static scrapers = new Map<string, typeof BaseScraper>([
    ['books-scraper', BooksScraper],
    // Add more scrapers here
  ]);
  
  static create(name: string, config: ScraperConfig): BaseScraper {
    const ScraperClass = this.scrapers.get(name);
    if (!ScraperClass) {
      throw new Error(`Unknown scraper: ${name}`);
    }
    
    const components: ScraperComponents = {
      config,
      logger: Logger.create(name),
      outputManager: new OutputManager(config),
      retryManager: new RetryManager()
    };
    
    return new ScraperClass(components);
  }
  
  static register(name: string, scraperClass: typeof BaseScraper): void {
    this.scrapers.set(name, scraperClass);
  }
}
```

## Testing

### 1. Unit Test Example
**tests/unit/scrapers/books.test.ts**
```typescript
import { BooksScraper } from '../../../src/scrapers/books';
import { ScraperComponents } from '../../../src/scrapers/base';
import { Logger } from '../../../src/core/logger';
import { OutputManager } from '../../../src/outputs/manager';
import { RetryManager } from '../../../src/utils/retry';

describe('BooksScraper', () => {
  let scraper: BooksScraper;
  let mockComponents: ScraperComponents;
  
  beforeEach(() => {
    mockComponents = {
      config: {
        name: 'test',
        selectors: {
          title: 'h1',
          price: '.price'
        }
      },
      logger: Logger.create('test'),
      outputManager: {
        initialize: jest.fn().mockResolvedValue({ isOk: () => true }),
        process: jest.fn().mockResolvedValue({ isOk: () => true }),
        finalize: jest.fn().mockResolvedValue({ isOk: () => true })
      } as any,
      retryManager: {
        retry: jest.fn((fn) => fn())
      } as any
    };
    
    scraper = new BooksScraper(mockComponents);
  });
  
  it('should extract data correctly', async () => {
    const mockContext = {
      $: jest.fn((selector) => ({
        text: () => selector === 'h1' ? 'Test Book' : '£10.99',
        length: 1
      })),
      request: { url: 'https://example.com' }
    };
    
    const result = await scraper.extractData(mockContext);
    
    expect(result.isOk()).toBe(true);
    expect(result.value).toMatchObject({
      title: 'Test Book',
      price: 10.99,
      url: 'https://example.com'
    });
  });
});
```

### 2. Integration Test
**tests/integration/books.test.ts**
```typescript
import { ConfigLoader } from '../../../src/core/config';
import { ScraperFactory } from '../../../src/scrapers/factory';

describe('Books Scraper Integration', () => {
  it('should scrape and save to CSV', async () => {
    const config = await ConfigLoader.load('./tests/fixtures/books-test.json');
    expect(config.isOk()).toBe(true);
    
    const scraper = ScraperFactory.create('books-scraper', config.value);
    const result = await scraper.run(['https://books.toscrape.com']);
    
    expect(result.isOk()).toBe(true);
    // Verify CSV file exists and contains data
  });
});
```

## Production Deployment

### 1. Environment Configuration
**.env.production**
```env
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scrapers
DB_USER=scraper_user
DB_PASSWORD=${DB_PASSWORD}

# AWS
AWS_REGION=us-east-1
S3_BUCKET=scraper-outputs

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
```

### 2. Docker Setup
**Dockerfile**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build TypeScript
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY configs ./configs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node dist/cli/index.js validate configs/health-check.json

CMD ["node", "dist/cli/index.js"]
```

### 3. Docker Compose
**docker-compose.yml**
```yaml
version: '3.8'

services:
  scraper:
    build: .
    env_file: .env.production
    volumes:
      - ./exports:/app/exports
      - ./logs:/app/logs
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scrapers
      POSTGRES_USER: scraper_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Monitoring & Observability

### 1. Health Checks
**src/utils/health.ts**
```typescript
import { Result, ok, err } from 'neverthrow';
import { Pool } from 'pg';

export class HealthChecker {
  static async checkDatabase(connectionString: string): Promise<Result<void, Error>> {
    const pool = new Pool({ connectionString });
    
    try {
      await pool.query('SELECT 1');
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Database unhealthy: ${error}`));
    } finally {
      await pool.end();
    }
  }
  
  static async checkStorage(path: string): Promise<Result<void, Error>> {
    try {
      const fs = await import('fs/promises');
      await fs.access(path, fs.constants.W_OK);
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Storage unhealthy: ${error}`));
    }
  }
}
```

### 2. Metrics Collection
**src/utils/metrics.ts**
```typescript
export class MetricsCollector {
  private metrics = new Map<string, number>();
  
  increment(metric: string, value = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  timing(metric: string, duration: number): void {
    this.metrics.set(`${metric}.duration`, duration);
  }
  
  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }
  
  flush(): Record<string, number> {
    const snapshot = Object.fromEntries(this.metrics);
    this.metrics.clear();
    return snapshot;
  }
}
```

## Best Practices

### 1. Error Handling
- Always use Result types instead of throwing exceptions
- Log errors with context for debugging
- Implement retry logic for transient failures
- Use specific error codes for different failure types

### 2. Configuration
- Validate all configurations with Zod schemas
- Use environment variables for secrets
- Keep configuration files in version control
- Document all configuration options

### 3. Performance
- Use connection pooling for databases
- Implement batching for outputs
- Monitor memory usage and set limits
- Use streaming for large datasets

### 4. Testing
- Write unit tests for data extraction logic
- Create integration tests for full workflows
- Use fixtures for test data
- Mock external dependencies

### 5. Security
- Never commit secrets to version control
- Validate and sanitize all inputs
- Use least privilege for database access
- Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Rate Limiting**
   - Reduce `requestsPerMinute` in config
   - Increase delay between requests
   - Use proxy rotation if needed

2. **Memory Issues**
   - Reduce batch size in outputs
   - Enable streaming for large files
   - Monitor with `process.memoryUsage()`

3. **Selector Changes**
   - Use more specific selectors
   - Add fallback selectors
   - Monitor selector success rate

4. **Connection Errors**
   - Implement exponential backoff
   - Add connection pooling
   - Check firewall rules

## Roadmap

- [ ] Add proxy support with rotation
- [ ] Implement distributed scraping
- [ ] Add browser automation options
- [ ] Create web UI for monitoring
- [ ] Add webhook notifications
- [ ] Support for API scraping
- [ ] GraphQL endpoint for data access