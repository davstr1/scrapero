const Utils = require('./utils');
const CategoryMapper = require('./category-mapper');

class Extractors {
  static extractAppName($) {
    // Try multiple selectors for app name
    const selectors = [
      'h1',
      'h2:first',
      '[role="heading"]',
      'meta[property="og:title"]'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const content = selector.includes('meta') 
          ? element.attr('content') 
          : element.first().text().trim();
        
        if (content && content.length < 200) {
          return Utils.cleanText(content);
        }
      }
    }

    return '';
  }

  static extractRating($) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Look for rating patterns - specifically the concatenated pattern like "4.61600 reviews"
    const patterns = [
      /(\d\.\d)(\d+)\s*reviews?/i,  // Matches "4.61600 reviews"
      /(\d+\.?\d*)\s*out of 5/i,
      // Skip X/5 pattern as it often matches things like "1/5 Wouldn't recommend"
      /rating[:\s]+(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*stars?/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        if (rating >= 0 && rating <= 5) {
          return rating;
        }
      }
    }

    // Try structured data
    const structuredData = $('script[type="application/ld+json"]').text();
    if (structuredData) {
      try {
        const data = JSON.parse(structuredData);
        if (data.aggregateRating?.ratingValue) {
          return parseFloat(data.aggregateRating.ratingValue);
        }
      } catch (e) {}
    }

    return 0;
  }

  static extractReviewCount($) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Special pattern for Wix's concatenated format "4.61600 reviews"
    const concatenatedMatch = bodyText.match(/\d\.\d(\d+)\s*reviews?/i);
    if (concatenatedMatch) {
      return parseInt(concatenatedMatch[1]);
    }
    
    // Standard patterns - but check context to avoid false positives
    const patterns = [
      /(\d+[,\d]*)\s*reviews?/i,
      /(\d+[,\d]*)\s*ratings?/i,
      /based on\s*(\d+[,\d]*)/i,
      /\((\d+[,\d]*)\)\s*(?:reviews?|ratings?)/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (count > 0 && count < 10000000) { // Sanity check
          // Check context to avoid false positives like "Display 1000 reviews"
          const fullMatch = match[0];
          const index = bodyText.indexOf(fullMatch);
          const contextBefore = bodyText.substring(Math.max(0, index - 40), index).toLowerCase();
          const contextAfter = bodyText.substring(index, Math.min(bodyText.length, index + 40)).toLowerCase();
          
          // Skip if it's in a feature/pricing context
          const skipPhrases = ['display', 'show', 'up to', 'limit', 'maximum', 'plan', 'import', 'feature', 'benefit'];
          if (skipPhrases.some(phrase => contextBefore.includes(phrase) || contextAfter.includes(phrase))) {
            continue;
          }
          
          // Additional check: if count is exactly 1000 and no rating was found, it's likely a false positive
          if (count === 1000 && Extractors.extractRating($) === 0) {
            continue;
          }
          
          return count;
        }
      }
    }

    return 0;
  }

  static extractInstalls($) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Look for install patterns - Wix often shows this in various formats
    const patterns = [
      /(\d+[,\d]*\+?)\s*(?:active\s*)?install(?:s|ations)?/i,
      /installed\s*on\s*(\d+[,\d]*\+?)\s*sites?/i,
      /(\d+[,\d]*\+?)\s*sites?\s*use/i,
      /used\s*by\s*(\d+[,\d]*\+?)/i,
      /(\d+[,\d]*\+?)\s*active\s*users?/i,
      /(\d+(?:k|K|m|M)?)\s*downloads?/i,
      /(\d+(?:k|K|m|M)?)\s*merchants?/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        let installs = match[1];
        
        // Convert k/m notation to full numbers
        if (installs.match(/k$/i)) {
          installs = installs.replace(/k$/i, '000');
        } else if (installs.match(/m$/i)) {
          installs = installs.replace(/m$/i, '000000');
        }
        
        return installs;
      }
    }
    
    // Sometimes it's in a data attribute or hidden in the page
    const installAttr = $('[data-installs], [data-downloads], [data-users]').first().attr('data-installs') ||
                       $('[data-installs], [data-downloads], [data-users]').first().attr('data-downloads') ||
                       $('[data-installs], [data-downloads], [data-users]').first().attr('data-users');
    
    if (installAttr) {
      return installAttr;
    }

    return '';
  }

  static extractDeveloper($) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Look for developer patterns - Wix specific pattern "By DEVELOPER Free plan available"
    const patterns = [
      /By\s+([^F]+?)\s*(?:Free|Premium|from)/i,  // Wix pattern
      /(?:by|from|developed by|created by)\s+([^,\n]+?)(?:\s*free|\s*\$|\s*€|\s*-|\s*\|)/i,
      /developer[:\s]+([^,\n]+)/i,
      /provided by\s+([^,\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const developer = match[1].trim();
        // Exclude common false positives
        if (!developer.match(/^(the|this|our|free|premium|pro)$/i) && developer.length > 1) {
          return developer;
        }
      }
    }

    // Try link patterns
    const devLink = $('a[href*="developer"], a[href*="company"]').first().text().trim();
    if (devLink) {
      return devLink;
    }

    return '';
  }

  static extractPricing($) {
    const pricing = {
      hasFreeVersion: false,
      tiers: []
    };

    // Check for free version
    const freePatterns = [
      /free plan/i,
      /free version/i,
      /free forever/i,
      /100% free/i,
      /completely free/i
    ];

    const bodyText = $('body').text();
    pricing.hasFreeVersion = freePatterns.some(pattern => pattern.test(bodyText));

    // Extract pricing tiers
    const pricePatterns = [
      /([€$£¥])\s*(\d+(?:[.,]\d+)?)\s*(?:\/|per)\s*(month|year|mo|yr)/gi,
      /(\d+(?:[.,]\d+)?)\s*([€$£¥])\s*(?:\/|per)\s*(month|year|mo|yr)/gi,
      /from\s*([€$£¥])\s*(\d+(?:[.,]\d+)?)/gi
    ];

    const matches = new Set();
    
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(bodyText)) !== null) {
        const currency = match[1] || match[2];
        const amount = match[2] || match[1];
        const period = match[3] || 'month';
        
        const normalizedPeriod = period.toLowerCase().startsWith('y') ? 'year' : 'month';
        
        matches.add(JSON.stringify({
          currency,
          amount: parseFloat(amount.replace(',', '.')),
          period: normalizedPeriod
        }));
      }
    }

    pricing.tiers = Array.from(matches).map(item => JSON.parse(item))
      .sort((a, b) => a.amount - b.amount);

    return pricing;
  }

  static extractDescription($) {
    // Try meta description first
    const metaDesc = $('meta[name="description"], meta[property="og:description"]').attr('content');
    if (metaDesc) {
      return Utils.cleanText(metaDesc);
    }

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Look for Wix-specific description pattern after developer name
    const devMatch = bodyText.match(/By\s+[^F]+?\s*(?:Free|Premium).*?([A-Z][^.!?]+(?:[.!?]|$))/);
    if (devMatch && devMatch[1]) {
      const desc = devMatch[1].trim();
      if (desc.length > 10 && desc.length < 500) {
        return desc;
      }
    }
    
    // Look for description patterns
    const patterns = [
      /(?:See|View|Track|Monitor|Analyze|Create|Build|Manage)\s+[^.!?]+[.!?]/i,
      /(?:is a|helps|allows|enables)\s+[^.!?]+[.!?]/i
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match && match[0].length > 20 && match[0].length < 500) {
        return Utils.cleanText(match[0]);
      }
    }

    return '';
  }

  static extractFeatures($) {
    const features = [];
    
    // Look for feature lists
    const featureSelectors = [
      'ul li:contains("✓")',
      'ul li:contains("✔")',
      'ul li:contains("•")',
      'section:contains("Features") li',
      'section:contains("features") li',
      'div[class*="feature"] li'
    ];

    for (const selector of featureSelectors) {
      $(selector).each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 5 && text.length < 200) {
          features.push(Utils.cleanText(text));
        }
      });
      
      if (features.length > 0) break;
    }

    // Limit to reasonable number
    return features.slice(0, 10);
  }

  static extractIcon($) {
    // Look for app icon (not Wix logo)
    const iconSelectors = [
      'img[alt*="logo"]:not([src*="wix"])',
      'img[alt*="icon"]:not([src*="wix"])',
      'img[width="42"][height="42"]',
      'img[width="64"][height="64"]',
      'meta[property="og:image"]'
    ];

    for (const selector of iconSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = selector.includes('meta') 
          ? element.attr('content')
          : element.attr('src');
          
        if (src && !src.includes('wix-logo') && !src.includes('placeholder')) {
          return Utils.extractImageUrl(src);
        }
      }
    }

    // Find first reasonable sized image
    const images = $('img').filter((i, el) => {
      const src = $(el).attr('src') || '';
      const width = parseInt($(el).attr('width')) || 0;
      const height = parseInt($(el).attr('height')) || 0;
      
      return src && 
             !src.includes('wix-logo') &&
             !src.includes('placeholder') &&
             width > 30 && width < 200 &&
             height > 30 && height < 200;
    });

    if (images.length) {
      return Utils.extractImageUrl(images.first().attr('src'));
    }

    return '';
  }

  static extractScreenshots($) {
    const screenshots = [];
    
    // Look for gallery images
    const gallerySelectors = [
      'img[class*="gallery"]',
      'img[class*="screenshot"]',
      'section[class*="gallery"] img',
      'div[class*="carousel"] img'
    ];

    for (const selector of gallerySelectors) {
      $(selector).each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('icon') && !src.includes('logo')) {
          screenshots.push(Utils.extractImageUrl(src));
        }
      });
    }

    // Limit screenshots
    return screenshots.slice(0, 5);
  }

  static extractTags($) {
    const tags = [];
    
    // Look for tag-like elements
    const tagSelectors = [
      'span[class*="tag"]',
      'a[class*="tag"]',
      'span[class*="label"]',
      'span[class*="category"]'
    ];

    for (const selector of tagSelectors) {
      $(selector).each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 30) {
          tags.push(text);
        }
      });
    }

    return [...new Set(tags)].slice(0, 10);
  }

  static extractLastUpdated($) {
    const patterns = [
      /last updated[:\s]+([^\n,]+)/i,
      /updated[:\s]+([^\n,]+)/i,
      /version[:\s]+[^\s]+\s+\(([^)]+)\)/i
    ];

    const bodyText = $('body').text();
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        // Try to parse as date
        const dateStr = match[1].trim();
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
        return dateStr;
      }
    }

    return '';
  }

  static extractSubcategories($) {
    const subcategories = [];
    
    try {
      // Primary selector: data-hook attribute
      const subcategoryElements = $('[data-hook^="subcategory-tag-button-"]');
      
      if (subcategoryElements.length > 0) {
        subcategoryElements.each((i, el) => {
          const $el = $(el);
          const dataHook = $el.attr('data-hook') || '';
          const href = $el.attr('href') || '';
          const displayName = $el.find('.wds_1_182_0_ButtonCore__content, span').first().text().trim();
          
          // Extract subcategory ID from data-hook
          const subcategoryId = dataHook.replace('subcategory-tag-button-', '');
          
          // Extract parent category from URL
          const urlMatch = href.match(/\/category\/([^\/]+)(?:\/[^\/]+)?/);
          const parentCategory = urlMatch ? urlMatch[1] : '';
          
          if (subcategoryId && displayName) {
            subcategories.push({
              id: subcategoryId,
              displayName: displayName,
              parentCategory: parentCategory,
              url: href
            });
          }
        });
      } else {
        // Fallback selector: links with subCat parameter
        const fallbackElements = $('[data-hook="categories-tags"] a[href*="subCat="]');
        
        fallbackElements.each((i, el) => {
          const $el = $(el);
          const href = $el.attr('href') || '';
          const displayName = $el.text().trim();
          
          // Extract subcategory from URL parameter
          const subCatMatch = href.match(/subCat=([^&]+)/);
          const subcategoryId = subCatMatch ? subCatMatch[1] : '';
          
          // Extract parent category from URL path
          const urlMatch = href.match(/\/category\/([^\/]+)/);
          const parentCategory = urlMatch ? urlMatch[1] : '';
          
          if (subcategoryId && displayName) {
            subcategories.push({
              id: subcategoryId,
              displayName: displayName,
              parentCategory: parentCategory,
              url: href
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error extracting subcategories:', error.message);
      if (process.env.DEBUG) {
        console.error('Subcategory extraction error details:', error);
      }
    }
    
    return subcategories;
  }
}

module.exports = Extractors;