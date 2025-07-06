const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function debugWix() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    // Test app page
    console.log('Testing app page...');
    await page.goto('https://www.wix.com/app-market/web-solution/visitor-analytics', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-app-page.png', fullPage: true });
    
    // Get page HTML
    const html = await page.content();
    await fs.writeFile('debug-app-page.html', html);
    
    // Extract data with better selectors
    const appData = await page.evaluate(() => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) {
            return { selector: sel, text: el.textContent.trim() };
          }
        }
        return null;
      };
      
      // Search for data in different ways
      const data = {
        // Try different h1/h2 selectors
        title: getText(['h1', 'h2', '[role="heading"]', '[class*="title"]:not([class*="section"])']),
        
        // Look for ratings
        rating: (() => {
          const ratingEl = document.querySelector('[aria-label*="rating"], [class*="rating"]:not([class*="breakdown"])');
          if (ratingEl) {
            const text = ratingEl.textContent;
            const match = text.match(/(\d+\.?\d*)/);
            return match ? match[1] : text;
          }
          return null;
        })(),
        
        // Search for installs in text
        installs: (() => {
          const body = document.body.textContent;
          const patterns = [
            /(\d+(?:[.,]\d+)*(?:\+)?)\s*(?:installs?|installations?)/i,
            /(\d+(?:[.,]\d+)*(?:\+)?)\s*(?:sites?|users?)/i,
            /(?:installed on|used by)\s*(\d+(?:[.,]\d+)*(?:\+)?)/i
          ];
          
          for (const pattern of patterns) {
            const match = body.match(pattern);
            if (match) return match[1];
          }
          return null;
        })(),
        
        // Developer info
        developer: (() => {
          // Look for "by" or "developed by" patterns
          const patterns = [
            /(?:by|developed by|created by)\s+([^,\n]+)/i,
            /developer[:\s]+([^,\n]+)/i
          ];
          
          const body = document.body.textContent;
          for (const pattern of patterns) {
            const match = body.match(pattern);
            if (match) return match[1].trim();
          }
          return null;
        })(),
        
        // Get all image URLs (for icon)
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width
        })).filter(img => img.src && !img.src.includes('wix-logo'))
      };
      
      return data;
    });
    
    console.log('App data:', JSON.stringify(appData, null, 2));
    
    // Test category page
    console.log('\nTesting category page...');
    await page.goto('https://www.wix.com/app-market/category/marketing', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const categoryData = await page.evaluate(() => {
      // Look for subcategories
      const subcategories = [];
      
      // Try different patterns
      const patterns = [
        'section h2',
        'section h3',
        '[class*="section"] [class*="title"]',
        '[class*="category"] [class*="title"]'
      ];
      
      patterns.forEach(pattern => {
        document.querySelectorAll(pattern).forEach(el => {
          const text = el.textContent.trim();
          if (text && !subcategories.includes(text)) {
            subcategories.push(text);
          }
        });
      });
      
      // Look for app links
      const appLinks = Array.from(document.querySelectorAll('a[href*="/web-solution/"]')).map(a => ({
        href: a.href,
        text: a.textContent.trim() || a.querySelector('img')?.alt || 'No text'
      }));
      
      return {
        subcategories,
        appCount: appLinks.length,
        sampleApps: appLinks.slice(0, 5)
      };
    });
    
    console.log('Category data:', JSON.stringify(categoryData, null, 2));
    
    console.log('\nDebug files saved:');
    console.log('- debug-app-page.png');
    console.log('- debug-app-page.html');
    console.log('\nKeep browser open for inspection...');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugWix();