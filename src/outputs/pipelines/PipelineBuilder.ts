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