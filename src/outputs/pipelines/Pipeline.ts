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
        } catch (error: any) {
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