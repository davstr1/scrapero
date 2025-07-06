const axios = require('axios');
const xml2js = require('xml2js');
const Utils = require('./utils');

class SitemapParser {
  constructor() {
    this.parser = new xml2js.Parser();
  }

  async parseSitemap(url = 'https://www.wix.com/sitemap.xml') {
    console.log(`Parsing sitemap: ${url}`);
    
    try {
      const response = await axios.get(url);
      const result = await this.parser.parseStringPromise(response.data);
      
      if (result.sitemapindex) {
        // This is a sitemap index, parse nested sitemaps
        return await this.parseSitemapIndex(result.sitemapindex);
      } else if (result.urlset) {
        // This is a regular sitemap
        return this.extractUrls(result.urlset);
      }
      
      return [];
    } catch (error) {
      console.error(`Error parsing sitemap ${url}:`, error.message);
      return [];
    }
  }

  async parseSitemapIndex(sitemapindex) {
    const allUrls = [];
    
    if (sitemapindex.sitemap) {
      for (const sitemap of sitemapindex.sitemap) {
        if (sitemap.loc && sitemap.loc[0]) {
          const nestedUrls = await this.parseSitemap(sitemap.loc[0]);
          allUrls.push(...nestedUrls);
        }
      }
    }
    
    return allUrls;
  }

  extractUrls(urlset) {
    const urls = [];
    
    if (urlset.url) {
      for (const url of urlset.url) {
        if (url.loc && url.loc[0]) {
          urls.push({
            url: url.loc[0],
            lastmod: url.lastmod ? url.lastmod[0] : null,
            changefreq: url.changefreq ? url.changefreq[0] : null,
            priority: url.priority ? url.priority[0] : null
          });
        }
      }
    }
    
    return urls;
  }

  async getAppUrls() {
    console.log('Fetching all app URLs from sitemap...');
    
    const allUrls = await this.parseSitemap();
    
    // Filter for app URLs
    const appUrls = allUrls.filter(item => 
      item.url.includes('/web-solution/') && 
      !item.url.includes('?')
    );
    
    console.log(`Found ${appUrls.length} app URLs in sitemap`);
    
    // Extract app info
    const apps = appUrls.map(item => {
      const slug = item.url.split('/web-solution/')[1]?.split('/')[0];
      return {
        slug,
        url: item.url,
        lastmod: item.lastmod,
        discoveredFrom: 'sitemap'
      };
    });
    
    // Remove duplicates
    const uniqueApps = Utils.removeDuplicates(apps, app => app.slug);
    
    console.log(`${uniqueApps.length} unique apps found`);
    
    return uniqueApps;
  }

  async saveAppUrls(filepath = 'data/sitemap-apps.json') {
    const apps = await this.getAppUrls();
    await Utils.writeJsonFile(filepath, {
      timestamp: Utils.getTimestamp(),
      source: 'sitemap',
      count: apps.length,
      apps
    });
    
    console.log(`Saved ${apps.length} apps to ${filepath}`);
    return apps;
  }
}

module.exports = SitemapParser;