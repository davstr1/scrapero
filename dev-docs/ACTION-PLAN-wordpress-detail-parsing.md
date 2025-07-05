# Action Plan: Implement WordPress Plugin Detail Page Parsing

## Date: 2025-07-05
## Priority: HIGH

## Phase 1: Setup Two-Phase Architecture

- [ ] Open `/src/scrapers/wordpress-plugins/index.ts`
- [ ] Add if statement in extractData: `if (context.request.userData?.isDetailPage)`
- [ ] Add return statement for detail branch: `return this.extractDetailPageData(context);`
- [ ] Add else statement with return for listing: `return this.extractListingPageData(context);`
- [ ] Save the file

## Phase 2: Create Method Stubs

- [ ] Create method signature: `private async extractListingPageData(context: any): Promise<any>`
- [ ] Move all current extractData logic into extractListingPageData
- [ ] Create method signature: `private async extractDetailPageData(context: any): Promise<any>`
- [ ] Add basic return statement in extractDetailPageData: `return {};`
- [ ] Test that scraper still runs without errors

## Phase 3: Implement Plugin Enqueueing

- [ ] In extractListingPageData, after `return plugins;`, change to store in variable first
- [ ] Add for loop: `for (const plugin of plugins) {`
- [ ] Extract slug from URL: `const slug = plugin.url.split('/').filter(Boolean).pop();`
- [ ] Add enqueue call inside loop:
  ```typescript
  await context.enqueueRequest({
    url: plugin.url,
    userData: {
      isDetailPage: true,
      pluginSlug: slug,
      listingData: plugin
    }
  });
  ```
- [ ] Keep the return statement at the end
- [ ] Test enqueueing with console.log in extractDetailPageData

## Phase 4: Create Version Extraction

- [ ] Create method: `private async extractVersion(page: any): Promise<string>`
- [ ] Add selector query:
  ```typescript
  const versionText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
    const versionLi = els.find(el => el.textContent?.includes('Version'));
    return versionLi?.textContent || '';
  });
  ```
- [ ] Parse version: `return versionText.replace('Version', '').trim();`
- [ ] Add error handling with try-catch, return empty string on error
- [ ] Call from extractDetailPageData: `version: await this.extractVersion(page),`

## Phase 5: Create Last Updated Extraction

- [ ] Create method: `private async extractLastUpdated(page: any): Promise<string>`
- [ ] Add selector query:
  ```typescript
  const updatedText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
    const updatedLi = els.find(el => el.textContent?.includes('Last updated'));
    return updatedLi?.textContent || '';
  });
  ```
- [ ] Parse date: `return updatedText.replace('Last updated', '').trim();`
- [ ] Add error handling with try-catch
- [ ] Call from extractDetailPageData: `lastUpdated: await this.extractLastUpdated(page),`

## Phase 6: Create Days Since Update Calculation

- [ ] Create method: `private calculateDaysSinceUpdate(lastUpdatedText: string): number`
- [ ] Parse "X days ago" format: 
  ```typescript
  const match = lastUpdatedText.match(/(\d+)\s+days?\s+ago/);
  if (match) return parseInt(match[1]);
  ```
- [ ] Parse "X weeks ago" format:
  ```typescript
  const weeksMatch = lastUpdatedText.match(/(\d+)\s+weeks?\s+ago/);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;
  ```
- [ ] Return 0 as default
- [ ] Call after extracting lastUpdated: `lastUpdatedDays: this.calculateDaysSinceUpdate(lastUpdated),`

## Phase 7: Create Download URL Extraction

- [ ] Create method: `private async extractDownloadUrl(page: any): Promise<string>`
- [ ] Add selector: `const downloadLink = await page.$eval('.plugin-download a.button', el => el.getAttribute('href'));`
- [ ] Add catch block returning empty string
- [ ] Call from extractDetailPageData: `downloadUrl: await this.extractDownloadUrl(page),`

## Phase 8: Extract WordPress Version Requirement

- [ ] Create method: `private async extractWPVersion(page: any): Promise<string>`
- [ ] Add selector query:
  ```typescript
  const wpText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
    const wpLi = els.find(el => el.textContent?.includes('Requires WordPress Version'));
    return wpLi?.textContent || '';
  });
  ```
- [ ] Extract version number: `const match = wpText.match(/[\d.]+/);`
- [ ] Return match result: `return match ? match[0] : '';`
- [ ] Add error handling
- [ ] Call from extractDetailPageData: `requiresWP: await this.extractWPVersion(page),`

## Phase 9: Extract PHP Version Requirement

- [ ] Create method: `private async extractPHPVersion(page: any): Promise<string>`
- [ ] Add selector query:
  ```typescript
  const phpText = await page.$$eval('.widget.plugin-meta li', (els: any[]) => {
    const phpLi = els.find(el => el.textContent?.includes('Requires PHP Version'));
    return phpLi?.textContent || '';
  });
  ```
- [ ] Extract version number: `const match = phpText.match(/[\d.]+/);`
- [ ] Return match result: `return match ? match[0] : '';`
- [ ] Add error handling
- [ ] Call from extractDetailPageData: `requiresPHP: await this.extractPHPVersion(page),`

## Phase 10: Merge Listing and Detail Data

- [ ] In extractDetailPageData, get listing data: `const { listingData } = context.request.userData;`
- [ ] Create detail data object with all extracted fields
- [ ] Return merged object: `return { ...listingData, ...detailData };`
- [ ] Test with console.log to verify merge

## Phase 11: Update CSV Configuration

- [ ] Open the scraper configuration file
- [ ] Locate the CSV headers configuration
- [ ] Add `version` to headers array
- [ ] Add `lastUpdated` to headers array
- [ ] Add `lastUpdatedDays` to headers array
- [ ] Add `downloadUrl` to headers array
- [ ] Add `requiresWP` to headers array
- [ ] Add `requiresPHP` to headers array
- [ ] Save configuration file

## Phase 12: Update Rate Limiting Configuration

- [ ] Open `/src/scrapers/wordpress-plugins/config.json`
- [ ] Change `requestsPerMinute` from 20 to 10
- [ ] Change `delayBetweenRequests` from 3000 to 6000
- [ ] Add `maxConcurrency: 2` to config
- [ ] Save configuration file

## Phase 13: Add Basic Error Handling

- [ ] Wrap extractDetailPageData content in try-catch
- [ ] Log errors: `console.error('Failed to extract detail data:', error);`
- [ ] Return listing data on error: `return context.request.userData.listingData;`
- [ ] Add null checks for page parameter
- [ ] Test with invalid URL

## Phase 14: Implement Support Stats Extraction

- [ ] Create method: `private async extractSupportStats(page: any): Promise<any>`
- [ ] Query support widget:
  ```typescript
  const stats = await page.$$eval('.widget ul li', (els: any[]) => {
    const result: any = {};
    els.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('Support threads')) {
        const match = text.match(/(\d+)/);
        result.totalThreads = match ? parseInt(match[1]) : 0;
      }
      if (text.includes('resolved in the last')) {
        const match = text.match(/(\d+)/);
        result.resolvedThreads = match ? parseInt(match[1]) : 0;
      }
    });
    return result;
  });
  ```
- [ ] Return stats object with defaults
- [ ] Add error handling
- [ ] Call from extractDetailPageData
- [ ] Add fields to CSV headers: `supportThreadsTotal`, `supportThreadsResolved`

## Phase 15: Extract Plugin Tags

- [ ] Create method: `private async extractTags(page: any): Promise<string>`
- [ ] Query tags: `const tags = await page.$$eval('.widget.entry-meta .tags a', els => els.map(el => el.textContent?.trim()));`
- [ ] Join with commas: `return tags.filter(Boolean).join(', ');`
- [ ] Add error handling returning empty string
- [ ] Call from extractDetailPageData: `tags: await this.extractTags(page),`
- [ ] Add `tags` to CSV headers

## Phase 16: Extract Contributors

- [ ] Create method: `private async extractContributors(page: any): Promise<string>`
- [ ] Find contributors section:
  ```typescript
  const contributors = await page.$$eval('.widget h3', async (headers: any[]) => {
    const contribHeader = headers.find(h => h.textContent?.includes('Contributors'));
    if (!contribHeader) return [];
    const list = contribHeader.nextElementSibling;
    if (!list) return [];
    return Array.from(list.querySelectorAll('a')).map((a: any) => a.textContent?.trim());
  });
  ```
- [ ] Join with commas: `return contributors.filter(Boolean).join(', ');`
- [ ] Add error handling
- [ ] Call from extractDetailPageData: `contributors: await this.extractContributors(page),`
- [ ] Add `contributors` to CSV headers

## Phase 17: Extract Plugin Homepage

- [ ] Create method: `private async extractHomepage(page: any): Promise<string>`
- [ ] Query for homepage link:
  ```typescript
  const homepage = await page.$$eval('.widget a', (links: any[]) => {
    const homepageLink = links.find(link => link.textContent?.includes('Plugin Homepage'));
    return homepageLink?.getAttribute('href') || '';
  });
  ```
- [ ] Add error handling
- [ ] Call from extractDetailPageData: `homepage: await this.extractHomepage(page),`
- [ ] Add `homepage` to CSV headers

## Phase 18: Handle Rate Limiting

- [ ] Create method: `private async handleRateLimit(error: any, context: any): Promise<void>`
- [ ] Check if error is 429: `if (error.message?.includes('429') || error.statusCode === 429)`
- [ ] Get retry count: `const retryCount = context.request.userData.retryCount || 0;`
- [ ] Check max retries: `if (retryCount >= 3) throw error;`
- [ ] Calculate backoff: `const delay = Math.pow(2, retryCount) * 1000;`
- [ ] Log retry: `console.log(\`Rate limited, retrying in ${delay}ms...\`);`
- [ ] Re-enqueue with delay:
  ```typescript
  await context.enqueueRequest({
    ...context.request,
    userData: { ...context.request.userData, retryCount: retryCount + 1 }
  });
  ```

## Phase 19: Add Progress Logging

- [ ] Add counter in class: `private processedCount = 0;`
- [ ] Increment in extractDetailPageData: `this.processedCount++;`
- [ ] Log progress: `console.log(\`Processed ${this.processedCount} plugin details\`);`
- [ ] Add timestamp to logs
- [ ] Log memory usage: `console.log(\`Memory: ${process.memoryUsage().heapUsed / 1024 / 1024}MB\`);`

## Phase 20: Final Testing

- [ ] Set `maxRequestsPerCrawl` to 5 for testing
- [ ] Run scraper: `npm run scraper run wordpress-plugins`
- [ ] Check console for enqueued detail pages
- [ ] Verify CSV has new columns
- [ ] Check that detail data is populated
- [ ] Verify no 429 errors
- [ ] Check total execution time
- [ ] Reset `maxRequestsPerCrawl` for production

## Success Criteria

1. ✓ All detail page fields are extracted
2. ✓ CSV contains enriched data
3. ✓ No rate limiting errors
4. ✓ Graceful error handling
5. ✓ Execution time under 5 minutes for 20 plugins