const fs = require('fs').promises;
const path = require('path');

class Utils {
  static async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async readJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  static async writeJsonFile(filePath, data) {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  static cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  static extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static getTimestamp() {
    return new Date().toISOString();
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static removeDuplicates(array, keyFn = x => x) {
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  static parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^0-9.,]/g, '');
    const price = parseFloat(cleanPrice.replace(',', '.'));
    
    const currency = priceText.match(/[€$£¥]/)?.[0] || 'USD';
    const period = priceText.toLowerCase().includes('month') ? 'month' : 
                   priceText.toLowerCase().includes('year') ? 'year' : 'once';
    
    return {
      amount: price || 0,
      currency,
      period
    };
  }

  static extractImageUrl(src) {
    if (!src) return '';
    
    // Handle Wix image URLs with transformations
    if (src.includes('static.wixstatic.com')) {
      // Remove transformation parameters to get original image
      const match = src.match(/([^/]+\.(jpg|jpeg|png|gif|webp))/i);
      if (match) {
        const baseUrl = src.split('/v1/')[0];
        return `${baseUrl}/v1/fill/${match[0]}`;
      }
    }
    
    return src;
  }
}

module.exports = Utils;