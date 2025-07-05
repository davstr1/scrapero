import fs from 'fs';
import path from 'path';
import { ScraperConfig } from '../outputs/base/interfaces';

export class ConfigLoader {
  private static configs = new Map<string, any>();

  static load(configPath: string): ScraperConfig {
    if (this.configs.has(configPath)) {
      return this.configs.get(configPath);
    }

    const fullPath = path.resolve(configPath);
    const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Handle inheritance with "extends"
    if (config.extends) {
      const baseConfig = this.loadGlobalConfig(config.extends);
      const mergedConfig = this.mergeConfigs(baseConfig, config);
      this.configs.set(configPath, mergedConfig);
      return mergedConfig;
    }

    this.configs.set(configPath, config);
    return config;
  }

  static loadGlobalConfig(type: string): any {
    const globalPath = path.resolve(`configs/${type}.json`);
    return JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  }

  static getDbConnection(connectionName: string): any {
    const outputConfig = this.loadGlobalConfig('outputs');
    return outputConfig.database.connections[connectionName];
  }

  private static mergeConfigs(base: any, override: any): any {
    return {
      ...base,
      ...override,
      selectors: { ...base.selectors, ...override.selectors },
      proxy: { ...base.proxy, ...override.proxy },
      rateLimit: { ...base.rateLimit, ...override.rateLimit }
    };
  }
}