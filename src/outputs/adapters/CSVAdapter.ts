import { OutputAdapter } from '../base/OutputAdapter';
import { BatchResult } from '../base/interfaces';
import { createWriteStream, WriteStream } from 'fs';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

export class CSVAdapter extends OutputAdapter {
  private writeStream!: WriteStream;
  private filePath!: string;
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
        const values = Object.values(row).map(val => this.escapeCSVField(val));
        this.writeStream.write(values.join(this.config.config.delimiter || ',') + '\n');
      }

      return {
        success: true,
        processedCount: data.length,
        errorCount: 0
      };
    } catch (error: any) {
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

  private escapeCSVField(field: any): string {
    if (field === null || field === undefined) return '';
    
    const stringValue = String(field);
    
    // Check if field needs quoting
    const needsQuoting = stringValue.includes(',') || 
                        stringValue.includes('"') || 
                        stringValue.includes('\n') || 
                        stringValue.includes('\r') ||
                        stringValue.startsWith(' ') ||
                        stringValue.endsWith(' ');
    
    if (needsQuoting) {
      // Escape quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return stringValue;
  }
}