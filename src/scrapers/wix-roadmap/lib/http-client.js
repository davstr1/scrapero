const axios = require('axios');
const axiosRetry = require('axios-retry').default;
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
      timeout: this.config.timeout || 30000,
      headers: this.config.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    // Configure retry logic
    axiosRetry(client, {
      retries: this.config.retries || 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response && error.response.status >= 500);
      },
      onRetry: (retryCount, error) => {
        console.log(`Retry attempt ${retryCount} for ${error.config.url}`);
      }
    });

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

      return response;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 1000 / (config.rateLimit?.maxRequestsPerSecond || 2); // Default 2 req/sec

    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  getStats() {
    return {
      requestCount: this.requestCount
    };
  }
}

module.exports = HttpClient;