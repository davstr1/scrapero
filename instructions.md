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
npm install crawlee playwright cheerio zod neverthrow tsyringe \
  winston date-fns dotenv commander reflect-metadata

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
mkdir -p src/core src/plugins src/runtime src/api src/cli \
  src/types configs tests/unit tests/integration tests/fixtures \
  storage exports logs docs examples
```

```
src/
├── core/           # Core interfaces and types
│   ├── plugin.ts   # Plugin system interfaces
│   ├── pipeline.ts # Pipeline composition
│   ├── context.ts  # Execution context
│   ├── result.ts   # Result<T,E> type
│   └── types.ts    # Shared TypeScript types
├── plugins/        # Plugin implementations
│   ├── extractors/ # Data extraction plugins
│   ├── outputs/    # Output format plugins
│   ├── transforms/ # Data transformation plugins
│   └── validators/ # Validation plugins
├── runtime/        # Execution engine
│   ├── engine.ts   # Main execution engine
│   ├── loader.ts   # Plugin loader
│   ├── registry.ts # Plugin registry
│   └── executor.ts # Pipeline executor
├── api/            # Public API
│   ├── index.ts    # Main exports
│   ├── builder.ts  # Fluent API builder
│   └── facade.ts   # Simplified interface
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
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./",
    "paths": {
      "@core/*": ["./src/core/*"],
      "@plugins/*": ["./src/plugins/*"],
      "@runtime/*": ["./src/runtime/*"],
      "@api/*": ["./src/api/*"],
      "@types/*": ["./src/types/*"]
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

### 1. Core Types and Interfaces
**src/core/result.ts**
```typescript
import { Result, ok, err, Ok, Err } from 'neverthrow';

export { Result, ok, err, Ok, Err };
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Helper to convert Promise to Result
export async function fromPromise<T>(
  promise: Promise<T>,
  errorFn?: (e: unknown) => Error
): AsyncResult<T> {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(errorFn ? errorFn(e) : new Error(String(e)));
  }
}
```

**src/core/plugin.ts**
```typescript
import { Result } from 'neverthrow';
import { z } from 'zod';
import { Context } from './context';

export interface PluginMetadata {
  name: string;
  version: string;
  type: 'extractor' | 'output' | 'transform' | 'validator';
  description?: string;
  configSchema?: z.ZodSchema;
}

export interface Plugin<TConfig = any, TInput = any, TOutput = any> {
  metadata: PluginMetadata;
  
  initialize?(config: TConfig): Promise<Result<void, Error>>;
  execute(input: TInput, context: Context): Promise<Result<TOutput, Error>>;
  cleanup?(): Promise<void>;
}

export interface PluginFactory<TConfig = any> {
  create(config: TConfig): Plugin;
}
```

**src/core/context.ts**
```typescript
import winston from 'winston';
import { injectable } from 'tsyringe';

@injectable()
export class Context {
  private data = new Map<string, any>();
  
  constructor(
    public readonly logger: winston.Logger,
    public readonly requestId: string = crypto.randomUUID()
  ) {}
  
  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }
  
  get<T>(key: string): T | undefined {
    return this.data.get(key);
  }
  
  has(key: string): boolean {
    return this.data.has(key);
  }
  
  child(meta: Record<string, any>): Context {
    const childLogger = this.logger.child({ ...meta, requestId: this.requestId });
    const childContext = new Context(childLogger, this.requestId);
    
    // Copy parent data
    this.data.forEach((value, key) => {
      childContext.set(key, value);
    });
    
    return childContext;
  }
}
```

**src/core/pipeline.ts**
```typescript
import { Result, ok, err } from 'neverthrow';
import { Plugin } from './plugin';
import { Context } from './context';

export interface PipelineStep {
  plugin: Plugin;
  name: string;
}

export class Pipeline {
  private steps: PipelineStep[] = [];
  
  add(name: string, plugin: Plugin): this {
    this.steps.push({ name, plugin });
    return this;
  }
  
  async execute<T>(input: T, context: Context): Promise<Result<T, Error>> {
    let current = input;
    
    for (const step of this.steps) {
      const stepContext = context.child({ step: step.name });
      stepContext.logger.debug('Executing pipeline step', { step: step.name });
      
      const result = await step.plugin.execute(current, stepContext);
      if (result.isErr()) {
        return err(new Error(`Pipeline failed at ${step.name}: ${result.error.message}`));
      }
      
      current = result.value;
    }
    
    return ok(current);
  }
}
```

**src/core/types.ts**
```typescript
export interface ScrapedData {
  url: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Selector {
  selector: string;
  attribute?: string;
  transform?: (value: string) => any;
}

export interface ExtractorConfig {
  selectors: Record<string, Selector | string>;
  waitForSelector?: string;
  timeout?: number;
}
```

### 2. Plugin System Implementation
**src/runtime/registry.ts**
```typescript
import { injectable, singleton } from 'tsyringe';
import { Plugin, PluginFactory } from '@core/plugin';
import { Result, ok, err } from 'neverthrow';

@singleton()
@injectable()
export class PluginRegistry {
  private plugins = new Map<string, PluginFactory>();
  private instances = new Map<string, Plugin>();
  
  register(name: string, factory: PluginFactory): void {
    this.plugins.set(name, factory);
  }
  
  create(name: string, config?: any): Result<Plugin, Error> {
    const factory = this.plugins.get(name);
    if (!factory) {
      return err(new Error(`Plugin not found: ${name}`));
    }
    
    try {
      const plugin = factory.create(config);
      this.instances.set(name, plugin);
      return ok(plugin);
    } catch (error) {
      return err(new Error(`Failed to create plugin ${name}: ${error}`));
    }
  }
  
  get(name: string): Plugin | undefined {
    return this.instances.get(name);
  }
  
  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}
```

**src/runtime/loader.ts**
```typescript
import { injectable } from 'tsyringe';
import { PluginRegistry } from './registry';
import { Result, ok, err } from 'neverthrow';
import * as path from 'path';
import * as fs from 'fs/promises';

@injectable()
export class PluginLoader {
  constructor(private registry: PluginRegistry) {}
  
  async loadFromDirectory(dir: string): Promise<Result<void, Error>> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(dir, entry.name);
          await this.loadPlugin(pluginPath);
        }
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to load plugins: ${error}`));
    }
  }
  
  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const indexPath = path.join(pluginPath, 'index.ts');
      const module = await import(indexPath);
      
      if (module.default && typeof module.default.create === 'function') {
        const metadata = module.default.metadata || {};
        this.registry.register(metadata.name, module.default);
      }
    } catch (error) {
      // Skip invalid plugins
      console.warn(`Failed to load plugin from ${pluginPath}:`, error);
    }
  }
}
```

### 3. Execution Engine
**src/runtime/engine.ts**
```typescript
import { injectable, inject } from 'tsyringe';
import { PlaywrightCrawler, CheerioCrawler } from 'crawlee';
import { Result, ok, err } from 'neverthrow';
import { Pipeline } from '@core/pipeline';
import { Context } from '@core/context';
import { PluginRegistry } from './registry';
import winston from 'winston';

export interface EngineConfig {
  crawlerType: 'playwright' | 'cheerio';
  maxRequestsPerCrawl?: number;
  maxConcurrency?: number;
  requestHandlerTimeoutSecs?: number;
}

@injectable()
export class ScrapingEngine {
  private crawler?: PlaywrightCrawler | CheerioCrawler;
  
  constructor(
    @inject('Logger') private logger: winston.Logger,
    private registry: PluginRegistry
  ) {}
  
  async initialize(config: EngineConfig): Promise<Result<void, Error>> {
    try {
      const crawlerOptions = {
        maxRequestsPerCrawl: config.maxRequestsPerCrawl || 100,
        maxConcurrency: config.maxConcurrency || 1,
        requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs || 60,
        requestHandler: this.createRequestHandler()
      };
      
      if (config.crawlerType === 'playwright') {
        this.crawler = new PlaywrightCrawler(crawlerOptions);
      } else {
        this.crawler = new CheerioCrawler(crawlerOptions);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to initialize engine: ${error}`));
    }
  }
  
  private createRequestHandler() {
    return async (crawlerContext: any) => {
      const { request } = crawlerContext;
      const context = new Context(this.logger);
      context.set('url', request.url);
      context.set('crawlerContext', crawlerContext);
      
      // Execute pipeline
      const pipeline = context.get<Pipeline>('pipeline');
      if (pipeline) {
        const result = await pipeline.execute(crawlerContext, context);
        if (result.isErr()) {
          this.logger.error('Pipeline execution failed', {
            url: request.url,
            error: result.error.message
          });
        }
      }
    };
  }
  
  async run(urls: string[], pipeline: Pipeline): Promise<Result<void, Error>> {
    if (!this.crawler) {
      return err(new Error('Engine not initialized'));
    }
    
    try {
      // Store pipeline in context for request handler
      const context = new Context(this.logger);
      context.set('pipeline', pipeline);
      
      await this.crawler.run(urls);
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Scraping failed: ${error}`));
    }
  }
}
```

### 4. Plugin Implementations
**src/plugins/extractors/cheerio-extractor.ts**
```typescript
import { Plugin, PluginMetadata } from '@core/plugin';
import { Context } from '@core/context';
import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';
import { ExtractorConfig, ScrapedData } from '@core/types';

const ConfigSchema = z.object({
  selectors: z.record(z.union([
    z.string(),
    z.object({
      selector: z.string(),
      attribute: z.string().optional(),
      transform: z.function().optional()
    })
  ])),
  waitForSelector: z.string().optional(),
  timeout: z.number().default(30000)
});

export class CheerioExtractorPlugin implements Plugin<ExtractorConfig> {
  metadata: PluginMetadata = {
    name: 'cheerio-extractor',
    version: '1.0.0',
    type: 'extractor',
    description: 'Extracts data using Cheerio selectors',
    configSchema: ConfigSchema
  };
  
  constructor(private config: ExtractorConfig) {}
  
  async execute(input: any, context: Context): Promise<Result<ScrapedData, Error>> {
    const { $ } = input; // Cheerio instance from crawler
    const url = context.get<string>('url') || '';
    
    try {
      const data: Record<string, any> = {};
      
      for (const [key, selectorConfig] of Object.entries(this.config.selectors)) {
        const selector = typeof selectorConfig === 'string' 
          ? selectorConfig 
          : selectorConfig.selector;
          
        const element = $(selector);
        if (element.length === 0) {
          context.logger.warn(`Selector not found: ${key}`, { selector });
          continue;
        }
        
        let value: any;
        if (typeof selectorConfig === 'object' && selectorConfig.attribute) {
          value = element.attr(selectorConfig.attribute);
        } else {
          value = element.text().trim();
        }
        
        if (typeof selectorConfig === 'object' && selectorConfig.transform) {
          value = selectorConfig.transform(value);
        }
        
        data[key] = value;
      }
      
      return ok({
        url,
        timestamp: new Date(),
        data,
        metadata: { extractorType: 'cheerio' }
      });
    } catch (error) {
      return err(new Error(`Extraction failed: ${error}`));
    }
  }
}

export default {
  metadata: CheerioExtractorPlugin.prototype.metadata,
  create: (config: ExtractorConfig) => new CheerioExtractorPlugin(config)
};
```

**src/plugins/outputs/csv-plugin.ts**
```typescript
import { Plugin, PluginMetadata } from '@core/plugin';
import { Context } from '@core/context';
import { Result, ok, err } from 'neverthrow';
import { createWriteStream, WriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { z } from 'zod';
import { ScrapedData } from '@core/types';

const ConfigSchema = z.object({
  path: z.string(),
  headers: z.boolean().default(true),
  delimiter: z.string().default(','),
  batchSize: z.number().default(100)
});

export class CSVOutputPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'csv-output',
    version: '1.0.0',
    type: 'output',
    description: 'Writes scraped data to CSV files',
    configSchema: ConfigSchema
  };
  
  private stream?: WriteStream;
  private headerWritten = false;
  private buffer: any[] = [];
  
  constructor(private config: z.infer<typeof ConfigSchema>) {}
  
  async initialize(): Promise<Result<void, Error>> {
    try {
      await mkdir(dirname(this.config.path), { recursive: true });
      this.stream = createWriteStream(this.config.path);
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to initialize CSV output: ${error}`));
    }
  }
  
  async execute(input: ScrapedData[], context: Context): Promise<Result<void, Error>> {
    try {
      this.buffer.push(...input);
      
      if (this.buffer.length >= this.config.batchSize) {
        return this.flush();
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new Error(`CSV write failed: ${error}`));
    }
  }
  
  private async flush(): Promise<Result<void, Error>> {
    if (!this.stream || this.buffer.length === 0) {
      return ok(undefined);
    }
    
    try {
      // Write headers on first flush
      if (this.config.headers && !this.headerWritten && this.buffer.length > 0) {
        const headers = Object.keys(this.buffer[0].data).join(this.config.delimiter);
        this.stream.write(`url,timestamp,${headers}\n`);
        this.headerWritten = true;
      }
      
      // Write data rows
      for (const item of this.buffer) {
        const values = [
          item.url,
          item.timestamp.toISOString(),
          ...Object.values(item.data).map(v => this.escapeValue(String(v)))
        ].join(this.config.delimiter);
        
        this.stream.write(values + '\n');
      }
      
      this.buffer = [];
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to flush CSV: ${error}`));
    }
  }
  
  async cleanup(): Promise<void> {
    await this.flush();
    
    return new Promise((resolve) => {
      if (!this.stream) {
        resolve();
        return;
      }
      
      this.stream.end(() => resolve());
    });
  }
  
  private escapeValue(value: string): string {
    if (value.includes(this.config.delimiter) || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export default {
  metadata: CSVOutputPlugin.prototype.metadata,
  create: (config: z.infer<typeof ConfigSchema>) => new CSVOutputPlugin(config)
};

```

### 5. API Builder
**src/api/builder.ts**
```typescript
import { container } from 'tsyringe';
import { Pipeline } from '@core/pipeline';
import { Context } from '@core/context';
import { PluginRegistry } from '@runtime/registry';
import { ScrapingEngine, EngineConfig } from '@runtime/engine';
import { Result } from 'neverthrow';
import winston from 'winston';

export class ScraperBuilder {
  private pipeline = new Pipeline();
  private engineConfig: EngineConfig = { crawlerType: 'cheerio' };
  private logger: winston.Logger;
  
  constructor(name: string = 'scraper') {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: { service: name },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
    
    container.register('Logger', { useValue: this.logger });
  }
  
  usePlaywright(): this {
    this.engineConfig.crawlerType = 'playwright';
    return this;
  }
  
  useCheerio(): this {
    this.engineConfig.crawlerType = 'cheerio';
    return this;
  }
  
  extract(pluginName: string, config?: any): this {
    const registry = container.resolve(PluginRegistry);
    const result = registry.create(pluginName, config);
    
    if (result.isOk()) {
      this.pipeline.add(`extract-${pluginName}`, result.value);
    } else {
      throw new Error(`Failed to create extractor: ${result.error.message}`);
    }
    
    return this;
  }
  
  transform(pluginName: string, config?: any): this {
    const registry = container.resolve(PluginRegistry);
    const result = registry.create(pluginName, config);
    
    if (result.isOk()) {
      this.pipeline.add(`transform-${pluginName}`, result.value);
    } else {
      throw new Error(`Failed to create transformer: ${result.error.message}`);
    }
    
    return this;
  }
  
  output(pluginName: string, config?: any): this {
    const registry = container.resolve(PluginRegistry);
    const result = registry.create(pluginName, config);
    
    if (result.isOk()) {
      this.pipeline.add(`output-${pluginName}`, result.value);
    } else {
      throw new Error(`Failed to create output: ${result.error.message}`);
    }
    
    return this;
  }
  
  async run(urls: string[]): Promise<Result<void, Error>> {
    const engine = container.resolve(ScrapingEngine);
    
    const initResult = await engine.initialize(this.engineConfig);
    if (initResult.isErr()) {
      return initResult;
    }
    
    return engine.run(urls, this.pipeline);
  }
}
```

### 6. Public API
**src/api/index.ts**
```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { PluginRegistry } from '@runtime/registry';
import { PluginLoader } from '@runtime/loader';
import { ScraperBuilder } from './builder';

// Initialize DI container
const registry = new PluginRegistry();
container.registerSingleton(PluginRegistry);
container.registerSingleton(PluginLoader);

// Export public API
export { ScraperBuilder } from './builder';
export { Plugin, PluginMetadata } from '@core/plugin';
export { Context } from '@core/context';
export { Result, ok, err } from '@core/result';
export * from '@core/types';

// Factory function
export function createScraper(name?: string): ScraperBuilder {
  return new ScraperBuilder(name);
}

// Load built-in plugins
export async function loadPlugins(directory: string = './src/plugins'): Promise<void> {
  const loader = container.resolve(PluginLoader);
  const result = await loader.loadFromDirectory(directory);
  
  if (result.isErr()) {
    throw result.error;
  }
}
```

### 7. CLI Interface
**src/cli/index.ts**
```typescript
#!/usr/bin/env node
import 'reflect-metadata';
import { Command } from 'commander';
import { createScraper, loadPlugins } from '@api/index';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('scraper')
  .description('Plugin-based web scraper')
  .version('1.0.0');

program
  .command('run <config>')
  .description('Run scraper with configuration file')
  .option('-u, --urls <urls...>', 'URLs to scrape')
  .action(async (configFile, options) => {
    try {
      // Load plugins
      await loadPlugins();
      
      // Load configuration
      const configPath = path.resolve(configFile);
      const configModule = await import(configPath);
      const config = configModule.default || configModule;
      
      // Build and run scraper
      const scraper = createScraper(config.name);
      
      // Apply configuration
      if (config.crawler) {
        config.crawler === 'playwright' 
          ? scraper.usePlaywright() 
          : scraper.useCheerio();
      }
      
      if (config.extract) {
        scraper.extract(config.extract.plugin, config.extract.config);
      }
      
      if (config.transforms) {
        for (const transform of config.transforms) {
          scraper.transform(transform.plugin, transform.config);
        }
      }
      
      if (config.outputs) {
        for (const output of config.outputs) {
          scraper.output(output.plugin, output.config);
        }
      }
      
      // Run scraper
      const urls = options.urls || config.urls || [];
      const result = await scraper.run(urls);
      
      if (result.isErr()) {
        console.error('❌ Scraping failed:', result.error.message);
        process.exit(1);
      }
      
      console.log('✅ Scraping completed successfully');
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('plugins')
  .description('List available plugins')
  .action(async () => {
    await loadPlugins();
    console.log('Available plugins:');
    // Would need to expose plugin list from registry
  });

program
  .command('create-plugin <name>')
  .description('Create a new plugin template')
  .option('-t, --type <type>', 'Plugin type', 'extractor')
  .action(async (name, options) => {
    const template = `import { Plugin, PluginMetadata } from '@core/plugin';
import { Context } from '@core/context';
import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

const ConfigSchema = z.object({
  // Define your config schema here
});

export class ${name}Plugin implements Plugin {
  metadata: PluginMetadata = {
    name: '${name}',
    version: '1.0.0',
    type: '${options.type}',
    description: 'Description of your plugin',
    configSchema: ConfigSchema
  };
  
  constructor(private config: z.infer<typeof ConfigSchema>) {}
  
  async execute(input: any, context: Context): Promise<Result<any, Error>> {
    try {
      // Your plugin logic here
      return ok(input);
    } catch (error) {
      return err(new Error(\`Plugin failed: \${error}\`));
    }
  }
}

export default {
  metadata: ${name}Plugin.prototype.metadata,
  create: (config: z.infer<typeof ConfigSchema>) => new ${name}Plugin(config)
};
`;
    
    const dir = `./src/plugins/${options.type}s`;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${name}.ts`), template);
    
    console.log(`✅ Created plugin template at ${dir}/${name}.ts`);
  });

program.parse();
```

## Example Usage

### 1. Simple Example
**examples/simple.ts**
```typescript
import { createScraper, loadPlugins } from '../src/api';

// Load plugins
await loadPlugins();

// Create and configure scraper
const scraper = createScraper('book-scraper')
  .useCheerio()
  .extract('cheerio-extractor', {
    selectors: {
      title: 'h1',
      price: { selector: '.price_color', transform: (v) => parseFloat(v.replace('£', '')) },
      availability: '.availability',
      rating: { selector: '.star-rating', attribute: 'class' }
    }
  })
  .output('csv-output', {
    path: './exports/books.csv',
    headers: true
  });

// Run scraper
const result = await scraper.run(['https://books.toscrape.com']);

if (result.isOk()) {
  console.log('Scraping completed!');
} else {
  console.error('Failed:', result.error);
}
```

### 2. Configuration-Based Example
**configs/books.config.ts**
```typescript
export default {
  name: 'books-scraper',
  crawler: 'cheerio',
  urls: ['https://books.toscrape.com'],
  
  extract: {
    plugin: 'cheerio-extractor',
    config: {
      selectors: {
        title: 'h1',
        price: {
          selector: '.price_color',
          transform: (value: string) => parseFloat(value.replace(/[£$]/, ''))
        },
        availability: '.availability',
        rating: {
          selector: '.star-rating',
          attribute: 'class',
          transform: (value: string) => {
            const match = value.match(/star-rating (\w+)/);
            return match ? match[1] : null;
          }
        }
      }
    }
  },
  
  transforms: [
    {
      plugin: 'add-metadata',
      config: {
        fields: {
          scrapedAt: () => new Date().toISOString(),
          source: 'books.toscrape.com'
        }
      }
    }
  ],
  
  outputs: [
    {
      plugin: 'csv-output',
      config: {
        path: './exports/books.csv',
        headers: true
      }
    },
    {
      plugin: 'console-output',
      config: {
        pretty: true
      }
    }
  ]
};
```

### 3. Custom Plugin Example
**src/plugins/transforms/add-metadata.ts**
```typescript
import { Plugin, PluginMetadata } from '@core/plugin';
import { Context } from '@core/context';
import { Result, ok } from 'neverthrow';
import { z } from 'zod';
import { ScrapedData } from '@core/types';

const ConfigSchema = z.object({
  fields: z.record(z.union([z.string(), z.function()]))
});

export class AddMetadataPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'add-metadata',
    version: '1.0.0',
    type: 'transform',
    description: 'Adds metadata fields to scraped data',
    configSchema: ConfigSchema
  };
  
  constructor(private config: z.infer<typeof ConfigSchema>) {}
  
  async execute(input: ScrapedData, context: Context): Promise<Result<ScrapedData, Error>> {
    const metadata: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(this.config.fields)) {
      metadata[key] = typeof value === 'function' ? value() : value;
    }
    
    return ok({
      ...input,
      data: {
        ...input.data,
        ...metadata
      }
    });
  }
}

export default {
  metadata: AddMetadataPlugin.prototype.metadata,
  create: (config: z.infer<typeof ConfigSchema>) => new AddMetadataPlugin(config)
};
```

## Testing

### 1. Plugin Unit Test
**tests/unit/plugins/cheerio-extractor.test.ts**
```typescript
import { CheerioExtractorPlugin } from '@plugins/extractors/cheerio-extractor';
import { Context } from '@core/context';
import winston from 'winston';

describe('CheerioExtractorPlugin', () => {
  let plugin: CheerioExtractorPlugin;
  let context: Context;
  
  beforeEach(() => {
    const logger = winston.createLogger({ silent: true });
    context = new Context(logger);
    context.set('url', 'https://example.com');
    
    plugin = new CheerioExtractorPlugin({
      selectors: {
        title: 'h1',
        price: {
          selector: '.price',
          transform: (v) => parseFloat(v.replace('£', ''))
        }
      }
    });
  });
  
  it('should extract data correctly', async () => {
    const mockCheerio = {
      $: jest.fn((selector) => ({
        text: () => selector === 'h1' ? 'Test Book' : '£10.99',
        length: 1,
        attr: jest.fn()
      }))
    };
    
    const result = await plugin.execute(mockCheerio, context);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.data).toMatchObject({
        title: 'Test Book',
        price: 10.99
      });
    }
  });
});
```

### 2. Integration Test
**tests/integration/scraper.test.ts**
```typescript
import { createScraper, loadPlugins } from '@api/index';
import * as fs from 'fs/promises';

describe('Scraper Integration', () => {
  beforeAll(async () => {
    await loadPlugins();
  });
  
  afterAll(async () => {
    // Clean up test outputs
    await fs.rm('./test-exports', { recursive: true, force: true });
  });
  
  it('should scrape and save to CSV', async () => {
    const scraper = createScraper('test')
      .useCheerio()
      .extract('cheerio-extractor', {
        selectors: {
          title: 'h1',
          price: '.price_color'
        }
      })
      .output('csv-output', {
        path: './test-exports/books.csv',
        headers: true
      });
    
    const result = await scraper.run(['https://books.toscrape.com/catalogue/page-1.html']);
    
    expect(result.isOk()).toBe(true);
    
    // Verify CSV file exists
    const stats = await fs.stat('./test-exports/books.csv');
    expect(stats.isFile()).toBe(true);
  });
});
```

## Best Practices

### 1. Plugin Development
- Keep plugins focused on a single responsibility
- Use Zod schemas for configuration validation
- Return Result types for error handling
- Log using the provided context logger
- Clean up resources in the cleanup method

### 2. Error Handling
- Always use Result types instead of throwing
- Provide meaningful error messages
- Include context in errors
- Let errors bubble up through the pipeline

### 3. Performance
- Use streaming for large datasets
- Implement batching in output plugins
- Reuse resources across plugin executions
- Monitor memory usage

### 4. Testing
- Unit test each plugin independently
- Mock external dependencies
- Test error scenarios
- Use integration tests for full pipelines

## Production Deployment

### 1. Docker Setup
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

# Install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built files and configs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/configs ./configs

# Create directories
RUN mkdir -p exports logs

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

CMD ["node", "dist/cli/index.js"]
```

### 2. Docker Compose
**docker-compose.yml**
```yaml
version: '3.8'

services:
  scraper:
    build: .
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./configs:/app/configs:ro
      - ./exports:/app/exports
      - ./logs:/app/logs
    restart: unless-stopped
    command: node dist/cli/index.js run /app/configs/production.config.js

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

## Troubleshooting

### Common Issues

1. **Plugin Not Found**
   - Ensure plugin is in the correct directory
   - Check plugin exports default factory
   - Verify plugin name matches

2. **Memory Issues**
   - Reduce batch size in output plugins
   - Implement streaming in plugins
   - Use pipeline transforms to filter data

3. **Type Errors**
   - Validate plugin configs with Zod
   - Check Result type handling
   - Ensure proper TypeScript configuration

4. **Pipeline Failures**
   - Check each plugin's error messages
   - Use context logger for debugging
   - Test plugins individually

## Architecture Benefits

1. **Modularity**: Each plugin is independent and reusable
2. **Type Safety**: Full TypeScript support with Zod validation
3. **Testability**: Plugins can be tested in isolation
4. **Extensibility**: Easy to add new functionality via plugins
5. **Composition**: Build complex scrapers from simple pieces
6. **Error Handling**: Consistent Result pattern throughout

## Migration Guide

From inheritance-based to plugin-based:

1. **Replace Base Classes**: Convert scrapers to extractor plugins
2. **Convert Output Adapters**: Rewrite as output plugins
3. **Update Configuration**: Use TypeScript configs instead of JSON
4. **Refactor Error Handling**: Use Result types everywhere
5. **Adopt Pipeline Pattern**: Chain plugins instead of method calls