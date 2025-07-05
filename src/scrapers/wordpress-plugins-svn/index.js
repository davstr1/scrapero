const path = require('path');
const { program } = require('commander');
const SVNDownloader = require('./lib/svn-downloader');
const SlugExtractor = require('./lib/slug-extractor');
const PluginScraper = require('./lib/plugin-scraper');
const ProgressTracker = require('./lib/progress-tracker');
const config = require('./config/config.json');

program
  .name('wordpress-svn-scraper')
  .description('Scrape WordPress plugins using SVN data as slug source')
  .version('1.0.0');

program
  .command('download-svn')
  .description('Download SVN data from WordPress.org')
  .option('-r, --resume', 'Resume interrupted download')
  .action(async (options) => {
    const downloader = new SVNDownloader(config);
    await downloader.download(options.resume);
  });

program
  .command('extract-slugs')
  .description('Extract plugin slugs from SVN data')
  .option('-i, --input <file>', 'SVN data file', path.join(__dirname, 'temp/svn-data.xml'))
  .option('-o, --output <file>', 'Output CSV file', path.join(__dirname, 'temp/plugin-slugs.csv'))
  .action(async (options) => {
    const extractor = new SlugExtractor(config);
    await extractor.extract(options.input, options.output);
  });

program
  .command('scrape')
  .description('Scrape plugin pages using extracted slugs')
  .option('-i, --input <file>', 'Plugin slugs CSV', path.join(__dirname, 'temp/plugin-slugs.csv'))
  .option('-o, --output <file>', 'Output CSV file', path.join(__dirname, 'output/wordpress-plugins-svn.csv'))
  .option('-r, --resume', 'Resume from last position')
  .option('-l, --limit <number>', 'Limit number of plugins to scrape', parseInt)
  .action(async (options) => {
    const scraper = new PluginScraper(config);
    await scraper.scrape(options);
  });

program
  .command('full')
  .description('Run full scraping process: download SVN, extract slugs, and scrape plugins')
  .option('-r, --resume', 'Resume any interrupted step')
  .action(async (options) => {
    console.log('Starting full WordPress SVN scraping process...\n');
    
    // Step 1: Download SVN data
    console.log('Step 1: Downloading SVN data...');
    const downloader = new SVNDownloader(config);
    const svnFile = await downloader.download(options.resume);
    
    // Step 2: Extract slugs
    console.log('\nStep 2: Extracting plugin slugs...');
    const extractor = new SlugExtractor(config);
    const slugsFile = await extractor.extract(svnFile, path.join(__dirname, 'temp/plugin-slugs.csv'));
    
    // Step 3: Scrape plugins
    console.log('\nStep 3: Scraping plugin pages...');
    const scraper = new PluginScraper(config);
    await scraper.scrape({
      input: slugsFile,
      output: path.join(__dirname, 'output/wordpress-plugins-svn.csv'),
      resume: options.resume
    });
    
    console.log('\nFull scraping process completed!');
  });

program.parse();