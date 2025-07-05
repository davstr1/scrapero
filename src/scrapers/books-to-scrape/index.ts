import { BaseScraper } from '../base/BaseScraper';

export default class BooksToScrapeScraper extends BaseScraper {
  constructor() {
    super('./src/scrapers/books-to-scrape/config.json');
  }

  setupHandlers(): Record<string, Function> {
    return {
      // Add custom handlers here
    };
  }

  async extractData(context: any): Promise<any> {
    const { request, $ } = context;
    const selectors = this.config.selectors;

    // For catalog pages, extract multiple books
    if (request.url.includes('/catalogue/')) {
      const books: any[] = [];
      
      $('.product_pod').each((index, element) => {
        const $element = $(element);
        
        const title = $element.find(selectors.title).attr('title') || '';
        const price = $element.find(selectors.price).text();
        const rating = $element.find(selectors.rating).attr('class')?.replace('star-rating ', '') || '';
        const availability = $element.find(selectors.availability).text().trim();
        const productUrl = $element.find(selectors.productLink).attr('href');
        
        books.push({
          title,
          price,
          rating,
          availability,
          productUrl: productUrl ? new URL(productUrl, request.url).href : '',
          scrapedAt: new Date().toISOString()
        });
      });
      
      return books;
    }
    
    // For individual product pages
    const data = {
      title: $(selectors.title).text(),
      price: $(selectors.price).text(),
      rating: $(selectors.rating).attr('class')?.replace('star-rating ', '') || '',
      availability: $(selectors.availability).text().trim(),
      url: request.url,
      scrapedAt: new Date().toISOString()
    };

    return data;
  }
}