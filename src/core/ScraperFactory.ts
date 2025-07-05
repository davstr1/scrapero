import { BaseScraper } from '../scrapers/base/BaseScraper';
import fs from 'fs';
import path from 'path';

export class ScraperFactory {
  private static scrapers = new Map<string, () => BaseScraper>();

  static register(name: string, scraperFactory: () => BaseScraper): void {
    this.scrapers.set(name, scraperFactory);
  }

  static create(scraperName: string): BaseScraper {
    const scraperFactory = this.scrapers.get(scraperName);
    if (scraperFactory) {
      return scraperFactory();
    }

    // Try to dynamically load scraper
    const scraperPath = path.join(process.cwd(), 'src', 'scrapers', scraperName);
    if (fs.existsSync(`${scraperPath}/index.ts`)) {
      const scraperModule = require(`${scraperPath}/index.ts`);
      const ScraperClass = scraperModule.default || scraperModule[Object.keys(scraperModule)[0]];
      return new ScraperClass();
    }

    throw new Error(`Scraper '${scraperName}' not found`);
  }

  static getAvailableScrapers(): string[] {
    const scrapersDir = path.join(process.cwd(), 'src', 'scrapers');
    if (!fs.existsSync(scrapersDir)) return [];

    return fs.readdirSync(scrapersDir)
      .filter(item => {
        const itemPath = path.join(scrapersDir, item);
        return fs.statSync(itemPath).isDirectory() && 
               item !== 'base' && 
               fs.existsSync(path.join(itemPath, 'index.ts'));
      });
  }
}