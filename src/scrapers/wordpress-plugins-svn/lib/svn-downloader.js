const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const ProgressBar = require('progress');

class SVNDownloader {
  constructor(config) {
    this.config = config;
    this.svnUrl = config.svn.url;
    this.outputPath = path.join(__dirname, '..', 'temp', 'svn-data.xml');
    this.tempPath = `${this.outputPath}.tmp`;
    this.progressPath = path.join(__dirname, '..', 'temp', 'svn-download-progress.json');
    
    // Setup proxy if enabled
    if (config.proxy.enabled) {
      this.proxyAgent = new HttpsProxyAgent(config.proxy.url);
    }
  }

  async download(resume = false) {
    try {
      console.log(`Downloading SVN data from: ${this.svnUrl}`);
      
      // Check if we should resume
      let startByte = 0;
      if (resume && fs.existsSync(this.tempPath) && fs.existsSync(this.progressPath)) {
        const progress = JSON.parse(fs.readFileSync(this.progressPath, 'utf8'));
        startByte = progress.downloadedBytes || 0;
        console.log(`Resuming download from byte: ${startByte}`);
      }

      // Prepare request headers
      const headers = {};
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }

      // Make request
      const axiosConfig = {
        method: 'GET',
        url: this.svnUrl,
        responseType: 'stream',
        timeout: this.config.svn.timeout,
        headers: {
          ...headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      };

      // Only use proxy if configured
      if (this.config.proxy.enabled && this.proxyAgent) {
        axiosConfig.httpAgent = this.proxyAgent;
        axiosConfig.httpsAgent = this.proxyAgent;
      }

      const response = await axios(axiosConfig);

      // Get total size
      const totalSize = startByte + parseInt(response.headers['content-length'] || '0');
      
      // Create progress bar
      const progressBar = new ProgressBar('Downloading [:bar] :percent :etas', {
        complete: '█',
        incomplete: '░',
        width: 40,
        total: totalSize,
        curr: startByte
      });

      // Create write stream
      const writeStream = fs.createWriteStream(this.tempPath, { 
        flags: startByte > 0 ? 'a' : 'w' 
      });

      // Track progress
      let downloadedBytes = startByte;
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        progressBar.tick(chunk.length);
        
        // Save progress every MB
        if (downloadedBytes % (1024 * 1024) === 0) {
          this.saveProgress(downloadedBytes, totalSize);
        }
      });

      // Pipe response to file
      response.data.pipe(writeStream);

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        response.data.on('error', reject);
      });

      // Move temp file to final location
      fs.renameSync(this.tempPath, this.outputPath);
      
      // Clean up progress file
      if (fs.existsSync(this.progressPath)) {
        fs.unlinkSync(this.progressPath);
      }

      console.log(`\nDownload completed! File saved to: ${this.outputPath}`);
      console.log(`Total size: ${this.formatBytes(totalSize)}`);
      
      return this.outputPath;

    } catch (error) {
      console.error('Download failed:', error.message);
      
      // Save progress for resume
      if (fs.existsSync(this.tempPath)) {
        const stats = fs.statSync(this.tempPath);
        this.saveProgress(stats.size, 0);
        console.log(`Progress saved. Run with --resume to continue from byte ${stats.size}`);
      }
      
      throw error;
    }
  }

  saveProgress(downloadedBytes, totalSize) {
    const progress = {
      downloadedBytes,
      totalSize,
      timestamp: new Date().toISOString(),
      url: this.svnUrl
    };
    
    // Ensure temp directory exists
    const tempDir = path.dirname(this.progressPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(this.progressPath, JSON.stringify(progress, null, 2));
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = SVNDownloader;