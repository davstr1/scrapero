const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs').promises;
const path = require('path');
const config = require('../config.json');

class HttpClient {
  constructor(options = {}) {
    this.config = { ...config.http, ...options };
    this.client = this.createClient();
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  createClient() {
    const client = axios.create({
      timeout: this.config.timeout,
      headers: this.config.headers,
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    // Configure retry logic
    axiosRetry(client, {
      retries: this.config.retries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response && error.response.status >= 500);
      },
      onRetry: (retryCount, error) => {
        console.log(`Retry attempt ${retryCount} for ${error.config.url}`);
      }
    });

    // Add proxy support if enabled
    if (config.proxy.enabled && config.proxy.url) {
      const proxyUrl = new URL(config.proxy.url);
      client.defaults.proxy = {
        host: proxyUrl.hostname,
        port: proxyUrl.port,
        auth: proxyUrl.username ? {
          username: proxyUrl.username,
          password: proxyUrl.password
        } : undefined
      };
    }

    return client;
  }

  async get(url, options = {}) {
    // Rate limiting
    await this.rateLimit();

    try {
      this.requestCount++;
      console.log(`[${this.requestCount}] GET ${url}`);
      
      const response = await this.client.get(url, options);
      
      if (response.status !== 200) {
        console.warn(`Non-200 status (${response.status}) for ${url}`);
      }

      // Save debug HTML if enabled
      if (config.scraping.saveDebugHtml && response.data) {
        await this.saveDebugHtml(url, response.data);
      }

      return response;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = config.scraping.delayBetweenRequests;

    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  async saveDebugHtml(url, html) {
    try {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.replace(/\//g, '_').replace(/^_/, '') || 'index';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filepath = path.join(config.output.debugDir, `${filename}_${timestamp}.html`);
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, html);
    } catch (error) {
      console.error('Error saving debug HTML:', error.message);
    }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      averageDelay: config.scraping.delayBetweenRequests
    };
  }
}

module.exports = HttpClient;