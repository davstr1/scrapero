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
  startUrls?: string[];
  crawlerType?: 'playwright' | 'cheerio';
  maxRequestsPerCrawl?: number;
  maxConcurrency?: number;
  requestHandlerTimeoutSecs?: number;
  selectors: Record<string, string>;
  pagination?: {
    nextButtonSelector: string;
    maxPages?: number;
  };
  proxy: {
    enabled: boolean;
    url?: string;
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