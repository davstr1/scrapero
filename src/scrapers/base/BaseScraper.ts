import { PlaywrightCrawler, CheerioCrawler } from 'crawlee';
import { ConfigLoader } from '../../core/ConfigLoader';
import { PipelineBuilder } from '../../outputs/pipelines/PipelineBuilder';
import { Pipeline } from '../../outputs/pipelines/Pipeline';
import { ScraperConfig } from '../../outputs/base/interfaces';
import { Logger } from '../../core/Logger';

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected pipeline!: Pipeline;
  protected crawler!: PlaywrightCrawler | CheerioCrawler;
  protected logger: any;

  constructor(configPath: string) {
    this.config = ConfigLoader.load(configPath);
    this.logger = Logger.child({ scraper: this.config.name });
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
            // Handle both single items and arrays
            const items = Array.isArray(data) ? data : [data];
            await this.pipeline.process(items);
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
            // Handle both single items and arrays
            const items = Array.isArray(data) ? data : [data];
            await this.pipeline.process(items);
          }
        },
        maxRequestsPerCrawl: this.config.maxRequestsPerCrawl || 100,
        ...this.getProxyConfig(),
        ...this.getRateLimitConfig()
      });
    }
  }

  async run(urls: string[]): Promise<void> {
    await this.setupPipeline();
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