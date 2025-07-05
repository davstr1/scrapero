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