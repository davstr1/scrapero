const puppeteer = require('puppeteer');

async function testSelectors() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.wix.com/app-market/web-solution/visitor-analytics', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test various selectors
    const tests = {
      name: await page.evaluate(() => {
        const selectors = [
          'h1',
          '[class*="app-name"]',
          '[class*="title"]',
          '[role="heading"]'
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) {
            return { selector: sel, text: el.textContent.trim() };
          }
        }
        return null;
      }),
      
      rating: await page.evaluate(() => {
        const selectors = [
          '[class*="rating"]',
          '[class*="stars"]',
          '[aria-label*="rating"]'
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            return { selector: sel, text: el.textContent.trim() };
          }
        }
        return null;
      }),
      
      installs: await page.evaluate(() => {
        const bodyText = document.body.textContent;
        const matches = bodyText.match(/(\d+(?:,\d+)*(?:\+)?)\s*(?:installs?|users?|sites?)/i);
        if (matches) {
          return { pattern: matches[0], number: matches[1] };
        }
        return null;
      }),
      
      developer: await page.evaluate(() => {
        const selectors = [
          '[class*="developer"]',
          '[class*="vendor"]',
          'a[href*="/developer/"]'
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) {
            return { selector: sel, text: el.textContent.trim() };
          }
        }
        return null;
      })
    };
    
    console.log('Selector test results:', JSON.stringify(tests, null, 2));
    
    // Get page structure
    const structure = await page.evaluate(() => {
      const getClassNames = (selector) => {
        const elements = document.querySelectorAll(selector);
        const classes = new Set();
        elements.forEach(el => {
          el.classList.forEach(cls => classes.add(cls));
        });
        return Array.from(classes);
      };
      
      return {
        h1Classes: getClassNames('h1'),
        h2Classes: getClassNames('h2'),
        h3Classes: getClassNames('h3'),
        divWithRating: getClassNames('div:contains("rating")'),
        divWithInstall: getClassNames('div:contains("install")')
      };
    });
    
    console.log('\nPage structure:', JSON.stringify(structure, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSelectors();