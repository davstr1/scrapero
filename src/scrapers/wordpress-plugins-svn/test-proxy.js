const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

async function testProxy() {
  const proxyUrl = 'http://sxbrfiav:z1rnitsp7b1x@82.25.216.29:6871/';
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  
  const testUrls = [
    'https://wordpress.org/plugins/hello-dolly/',
    'https://wordpress.org/plugins/akismet/',
    'https://wordpress.org/plugins/jetpack/'
  ];
  
  console.log('Testing proxy with WordPress.org...\n');
  
  // Test without proxy
  console.log('WITHOUT PROXY:');
  for (const url of testUrls) {
    try {
      const start = Date.now();
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const time = Date.now() - start;
      console.log(`✅ ${url} - Status: ${response.status} - Time: ${time}ms`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
  
  console.log('\nWITH PROXY:');
  for (const url of testUrls) {
    try {
      const start = Date.now();
      const response = await axios.get(url, {
        timeout: 10000,
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const time = Date.now() - start;
      console.log(`✅ ${url} - Status: ${response.status} - Time: ${time}ms`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Headers:`, error.response.headers);
      }
    }
  }
  
  // Test with more headers
  console.log('\nWITH PROXY + FULL HEADERS:');
  for (const url of testUrls.slice(0, 1)) {
    try {
      const start = Date.now();
      const response = await axios.get(url, {
        timeout: 10000,
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      const time = Date.now() - start;
      console.log(`✅ ${url} - Status: ${response.status} - Time: ${time}ms`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
}

testProxy().catch(console.error);