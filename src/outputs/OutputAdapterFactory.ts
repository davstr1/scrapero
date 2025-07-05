import { OutputAdapter } from './base/OutputAdapter';
import { OutputConfig } from './base/interfaces';
import { CSVAdapter } from './adapters/CSVAdapter';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';

export class OutputAdapterFactory {
  private static adapters = new Map<string, typeof OutputAdapter>([
    ['csv', CSVAdapter as any],
    ['database', DatabaseAdapter as any],
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
    return new (AdapterClass as any)(config);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}