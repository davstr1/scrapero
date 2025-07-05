import { OutputAdapter } from '../base/OutputAdapter';
import { BatchResult } from '../base/interfaces';
import { ConfigLoader } from '../../core/ConfigLoader';
import { Pool } from 'pg'; // PostgreSQL example

export class DatabaseAdapter extends OutputAdapter {
  private db!: Pool;
  private tableName!: string;

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
      } catch (error: any) {
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