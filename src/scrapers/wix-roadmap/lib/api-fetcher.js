const HttpClient = require('./http-client');
const config = require('../config.json');
const { getAllLabelIds } = require('./mappings');

class ApiFetcher {
  constructor() {
    this.httpClient = new HttpClient();
    this.baseUrl = config.baseUrl;
    this.labelIds = getAllLabelIds();
  }

  buildApiUrl(page) {
    const params = new URLSearchParams({
      locale: config.apiParams.locale,
      text: config.apiParams.text,
      pageSize: config.apiParams.pageSize,
      page: page,
      useVespa: config.apiParams.useVespa
    });
    
    // Add statuses[] parameters
    config.apiParams.statuses.forEach(status => {
      params.append('statuses[]', status);
    });
    
    // Add resolutions[] parameters
    config.apiParams.resolutions.forEach(resolution => {
      params.append('resolutions[]', resolution);
    });
    
    // Add all label IDs as hasAnyOfLabelIds[]
    this.labelIds.forEach(labelId => {
      params.append('hasAnyOfLabelIds[]', labelId);
    });
    
    return `${this.baseUrl}?${params.toString()}`;
  }

  async fetchPage(pageNumber) {
    const url = this.buildApiUrl(pageNumber);
    
    try {
      const response = await this.httpClient.get(url);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format: expected JSON object');
      }
      
      if (!Array.isArray(response.data.items)) {
        throw new Error('Invalid response format: missing items array');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`, error.message);
      throw error;
    }
  }

  async* fetchAllPages() {
    let page = 1;
    let hasMore = true;
    let totalCount = null;
    
    while (hasMore) {
      console.log(`\nFetching page ${page}...`);
      
      try {
        const data = await this.fetchPage(page);
        
        // Set total count from first response
        if (totalCount === null && data.itemsCount) {
          totalCount = data.itemsCount;
          console.log(`Total items available: ${totalCount}`);
        }
        
        const itemCount = data.items.length;
        console.log(`Retrieved ${itemCount} items from page ${page}`);
        
        yield {
          items: data.items,
          page: page,
          totalCount: totalCount
        };
        
        // Check if there are more pages
        hasMore = itemCount === config.apiParams.pageSize;
        page++;
        
      } catch (error) {
        console.error(`Failed to fetch page ${page}, stopping pagination`);
        hasMore = false;
      }
    }
    
    console.log(`\nPagination complete. Fetched ${page - 1} pages.`);
  }

  // Test method to fetch limited items
  async fetchLimited(limit = 10) {
    console.log(`Fetching first ${limit} items for testing...`);
    
    const data = await this.fetchPage(1);
    const limitedItems = data.items.slice(0, limit);
    
    return {
      items: limitedItems,
      totalCount: data.itemsCount
    };
  }
}

module.exports = ApiFetcher;