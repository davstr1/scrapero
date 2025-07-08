const fs = require('fs').promises;
const path = require('path');

class JsonAdapter {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.items = [];
  }

  async init() {
    // Create output directory if it doesn't exist
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.filename = `wix-roadmap-${timestamp}.json`;
    this.filepath = path.join(this.outputDir, this.filename);
    
    console.log(`JSON output will be saved to: ${this.filepath}`);
  }

  async write(items) {
    if (!Array.isArray(items) || items.length === 0) {
      console.log('No items to add to JSON');
      return;
    }
    
    // Add items to internal array
    this.items.push(...items);
    console.log(`Added ${items.length} items to JSON buffer (total: ${this.items.length})`);
  }

  async finalize() {
    const metadata = {
      scrapeDate: new Date().toISOString(),
      totalItems: this.items.length,
      resolutions: [...new Set(this.items.map(item => item.resolution))],
      categories: [...new Set(this.items.flatMap(item => item.categories))].sort()
    };
    
    const output = {
      metadata,
      items: this.items
    };
    
    try {
      // Write formatted JSON
      await fs.writeFile(this.filepath, JSON.stringify(output, null, 2));
      
      const stats = await fs.stat(this.filepath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      
      console.log(`\nJSON file finalized:`);
      console.log(`  File: ${this.filename}`);
      console.log(`  Size: ${sizeInKB} KB`);
      console.log(`  Items: ${this.items.length}`);
      console.log(`  Path: ${this.filepath}`);
      
      return {
        filename: this.filename,
        filepath: this.filepath,
        size: stats.size,
        itemCount: this.items.length
      };
    } catch (error) {
      console.error('Error writing JSON file:', error.message);
      throw error;
    }
  }
}

module.exports = JsonAdapter;