const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const readline = require('readline');
const stream = require('stream');

class SlugExtractor {
  constructor(config) {
    this.config = config;
    this.slugPattern = /href="([^\/]+)\//g;
    this.excludePatterns = ['.', '..', '_', 'tags', 'branches', 'trunk'];
  }

  async extract(inputFile, outputFile) {
    console.log(`Extracting plugin slugs from: ${inputFile}`);
    console.log(`Output will be saved to: ${outputFile}`);

    const slugs = new Set();
    let processedLines = 0;

    try {
      // Check if input file exists
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Input file not found: ${inputFile}`);
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Process file line by line to handle large files
      const fileStream = fs.createReadStream(inputFile);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      // Process each line
      for await (const line of rl) {
        processedLines++;
        
        // Show progress every 10000 lines
        if (processedLines % 10000 === 0) {
          console.log(`Processed ${processedLines} lines, found ${slugs.size} unique slugs so far...`);
        }

        // Extract slugs from href attributes
        const matches = line.matchAll(this.slugPattern);
        for (const match of matches) {
          const slug = match[1];
          
          // Filter out invalid slugs
          if (this.isValidSlug(slug)) {
            slugs.add(slug);
          }
        }
      }

      console.log(`\nProcessing complete!`);
      console.log(`Total lines processed: ${processedLines}`);
      console.log(`Total unique slugs found: ${slugs.size}`);

      // Convert to array and sort
      const slugArray = Array.from(slugs).sort();

      // Write to CSV
      await this.writeSlugsToCSV(slugArray, outputFile);

      console.log(`Slugs saved to: ${outputFile}`);
      return outputFile;

    } catch (error) {
      console.error('Error extracting slugs:', error.message);
      throw error;
    }
  }

  isValidSlug(slug) {
    // Check if slug is in exclude list
    if (this.excludePatterns.includes(slug)) {
      return false;
    }

    // Check if slug contains only valid characters
    if (!/^[a-z0-9\-_]+$/i.test(slug)) {
      return false;
    }

    // Check minimum length
    if (slug.length < 2) {
      return false;
    }

    // Additional SVN-specific exclusions
    if (slug.startsWith('.') || slug.startsWith('_')) {
      return false;
    }

    return true;
  }

  async writeSlugsToCSV(slugs, outputFile) {
    const writer = csvWriter({
      path: outputFile,
      header: [
        { id: 'slug', title: 'plugin_slug' },
        { id: 'url', title: 'plugin_url' },
        { id: 'status', title: 'scrape_status' }
      ]
    });

    const records = slugs.map(slug => ({
      slug: slug,
      url: `https://wordpress.org/plugins/${slug}/`,
      status: 'pending'
    }));

    await writer.writeRecords(records);
  }

  // Alternative method for parsing HTML-formatted SVN listing
  async extractFromHTML(inputFile, outputFile) {
    console.log(`Parsing HTML-formatted SVN listing...`);

    try {
      const content = fs.readFileSync(inputFile, 'utf8');
      const root = parse(content);
      const links = root.querySelectorAll('a[href]');
      
      const slugs = new Set();

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('/')) {
          const slug = href.replace(/\//g, '');
          if (this.isValidSlug(slug)) {
            slugs.add(slug);
          }
        }
      });

      console.log(`Found ${slugs.size} unique plugin slugs`);

      // Convert to array and sort
      const slugArray = Array.from(slugs).sort();

      // Write to CSV
      await this.writeSlugsToCSV(slugArray, outputFile);

      return outputFile;

    } catch (error) {
      console.error('Error parsing HTML:', error.message);
      throw error;
    }
  }
}

module.exports = SlugExtractor;