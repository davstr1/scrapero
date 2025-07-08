const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

class CsvAdapter {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.headers = [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'description', title: 'Description' },
      { id: 'url', title: 'URL' },
      { id: 'resolution', title: 'Resolution' },
      { id: 'resolutionCode', title: 'Resolution Code' },
      { id: 'status', title: 'Status' },
      { id: 'creationDate', title: 'Creation Date' },
      { id: 'readingTime', title: 'Reading Time (min)' },
      { id: 'categories', title: 'Categories' },
      { id: 'categoryIds', title: 'Category IDs' },
      { id: 'type', title: 'Type' },
      { id: 'docType', title: 'Doc Type' }
    ];
  }

  async init() {
    // Create output directory if it doesn't exist
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.filename = `wix-roadmap-${timestamp}.csv`;
    this.filepath = path.join(this.outputDir, this.filename);
    
    // Create CSV writer
    this.csvWriter = createObjectCsvWriter({
      path: this.filepath,
      header: this.headers
    });
    
    console.log(`CSV output will be saved to: ${this.filepath}`);
  }

  async write(items) {
    if (!Array.isArray(items) || items.length === 0) {
      console.log('No items to write to CSV');
      return;
    }
    
    // Transform items for CSV (join arrays with semicolons)
    const csvItems = items.map(item => ({
      ...item,
      categories: Array.isArray(item.categories) ? item.categories.join(';') : '',
      categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds.join(';') : ''
    }));
    
    try {
      await this.csvWriter.writeRecords(csvItems);
      console.log(`Wrote ${items.length} items to CSV`);
    } catch (error) {
      console.error('Error writing to CSV:', error.message);
      throw error;
    }
  }

  async finalize() {
    const stats = await fs.stat(this.filepath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`\nCSV file finalized:`);
    console.log(`  File: ${this.filename}`);
    console.log(`  Size: ${sizeInKB} KB`);
    console.log(`  Path: ${this.filepath}`);
    
    return {
      filename: this.filename,
      filepath: this.filepath,
      size: stats.size
    };
  }
}

module.exports = CsvAdapter;