# Action Plan: Wix Roadmap Scraper Implementation

## Phase 1: Project Setup (Foundation)

### [ ] 1. Create directory structure
- [ ] Create `src/scrapers/wix-roadmap/` directory
- [ ] Create `src/scrapers/wix-roadmap/lib/` subdirectory
- [ ] Create `src/scrapers/wix-roadmap/outputs/` subdirectory

### [ ] 2. Copy and adapt HttpClient
- [ ] Copy `http-client.js` from `src/scrapers/wix-app-market-nojs/lib/`
- [ ] Remove HTML-specific features (not needed for JSON API)
- [ ] Verify axios and retry logic work for JSON responses
- [ ] Test basic GET request to Wix API endpoint

### [ ] 3. Create mappings.js
- [ ] Create resolution code mappings:
  ```javascript
  const RESOLUTION_MAPPINGS = {
    110: "Collecting votes",
    111: "Planned",
    112: "Working on it",
    114: "Pre-launch",
    116: "Launched"
  };
  ```
- [ ] Create label ID to category name mappings (ALL 56 mappings from instructions):
  ```javascript
  const LABEL_MAPPINGS = {
    "ed58a591-473a-4294-b53b-03c8b48fe2ad": "Accessibility",
    "a1be0e06-d499-4fa0-8a11-6082ced19dfc": "AI tools",
    "cc1d7a25-883f-4873-9385-10a995bbe031": "Billing",
    // ... all 56 mappings from the instructions document
    "b2cd4c53-c6c8-4287-865c-2187eb527871": "Wix Stores",
    "0ac920ef-12a3-45b2-b023-29e9e24d2135": "Wix Video"
  };
  ```
- [ ] Add helper functions: `getResolutionName(code)`, `getCategoryNames(labelIds)`
- [ ] Export all mappings and helpers

### [ ] 4. Create config.json
- [ ] Define exact configuration:
  ```json
  {
    "name": "wix-roadmap",
    "baseUrl": "https://support.wix.com/en/api/article/search",
    "rateLimit": {
      "maxRequestsPerSecond": 2,
      "maxConcurrency": 1
    },
    "outputs": ["csv", "json"],
    "apiParams": {
      "locale": "en",
      "text": "+",
      "pageSize": 500,
      "useVespa": false,
      "statuses": [10, 0],
      "resolutions": [110, 111, 112, 114, 115, 116]
    },
    "labelIds": [
      "ed58a591-473a-4294-b53b-03c8b48fe2ad",
      // ... all 56 label IDs from instructions
    ]
  }
  ```

## Phase 2: Core Implementation

### [ ] 5. Implement api-fetcher.js
- [ ] Create function to build API URL with exact parameters:
  ```javascript
  function buildApiUrl(page, labelIds) {
    const params = new URLSearchParams({
      locale: 'en',
      text: '+',
      pageSize: 500,
      page: page,
      useVespa: false
    });
    
    // Add statuses[]=10&statuses[]=0
    params.append('statuses[]', '10');
    params.append('statuses[]', '0');
    
    // Add all resolutions
    [110, 111, 112, 114, 115, 116].forEach(r => 
      params.append('resolutions[]', r)
    );
    
    // Add all label IDs
    labelIds.forEach(id => 
      params.append('hasAnyOfLabelIds[]', id)
    );
    
    return `${baseUrl}?${params.toString()}`;
  }
  ```
- [ ] Implement `fetchPage(pageNumber)` function
- [ ] Add response validation (check for items array)
- [ ] Create `fetchAllPages()` generator function
- [ ] Test with page 1, limit 10 items

### [ ] 6. Create transformers.js
- [ ] Implement `transformItem(rawItem)` function with exact field mapping:
  ```javascript
  function transformItem(item) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      resolution: getResolutionName(item.resolution),
      resolutionCode: item.resolution,
      status: getResolutionName(item.resolution), // same as resolution
      creationDate: new Date(item.creationDate).toISOString(),
      readingTime: item.readingTimeInMinutes,
      categories: item.labels.map(label => 
        LABEL_MAPPINGS[label.id] || 'Unknown'
      ),
      categoryIds: item.labels.map(label => label.id),
      type: item.type,
      docType: item.docType
    };
  }
  ```
- [ ] Map resolution codes using RESOLUTION_MAPPINGS
- [ ] Map label IDs using LABEL_MAPPINGS
- [ ] Convert timestamp (milliseconds since epoch) to ISO date string
- [ ] Handle missing fields gracefully
- [ ] Add data validation (required fields: id, title, url)

### [ ] 7. Implement main index.js
- [ ] Set up imports and configuration loading
- [ ] Initialize HttpClient
- [ ] Create main `scrape()` function
- [ ] Implement pagination loop
- [ ] Add basic console logging
- [ ] Handle errors gracefully

## Phase 3: Output Adapters

### [ ] 8. Create CSV output adapter
- [ ] Copy structure from existing CSV adapters
- [ ] Define exact CSV headers:
  ```javascript
  const CSV_HEADERS = [
    'id',
    'title',
    'description',
    'url',
    'resolution',
    'resolutionCode',
    'status',
    'creationDate',
    'readingTime',
    'categories',  // Will be joined with semicolons
    'categoryIds', // Will be joined with semicolons
    'type',
    'docType'
  ];
  ```
- [ ] Handle array fields by joining with semicolons: `categories.join(';')`
- [ ] Implement streaming writes for large datasets
- [ ] Add file naming: `wix-roadmap-{YYYY-MM-DD-HHmmss}.csv`

### [ ] 9. Create JSON output adapter
- [ ] Implement simple JSON file writer
- [ ] Format output as array of items
- [ ] Pretty-print for readability
- [ ] Add metadata (scrape date, item count)

## Phase 4: Testing & Validation

### [ ] 10. Test with limited dataset
- [ ] Modify fetcher to limit to 10 items
- [ ] Run full scraper flow
- [ ] Verify CSV output format
- [ ] Verify JSON output format
- [ ] Check data transformation accuracy

### [ ] 11. Add error handling
- [ ] Add try-catch blocks in all async functions
- [ ] Implement retry logic for failed API calls
- [ ] Log errors with context
- [ ] Ensure scraper doesn't crash on errors
- [ ] Add graceful shutdown handling

## Phase 5: Full Implementation

### [ ] 12. Add progress tracking
- [ ] Extract total count from first API response (`itemsCount` field)
- [ ] Calculate pages needed: `Math.ceil(itemsCount / 500)`
- [ ] Count total items from first response
- [ ] Show progress percentage
- [ ] Display current page number
- [ ] Show items processed
- [ ] Add ETA calculation

### [ ] 13. Test full pagination
- [ ] Remove item limit
- [ ] Run scraper for all 2000+ items
- [ ] Monitor memory usage
- [ ] Verify all pages fetched
- [ ] Check final item count

### [ ] 14. Implement deduplication
- [ ] Track item IDs in Set
- [ ] Skip duplicate items
- [ ] Log duplicate count
- [ ] Ensure no data loss

### [ ] 15. Final verification
- [ ] Verify CSV has all expected columns
- [ ] Check date formatting is consistent
- [ ] Ensure categories are properly mapped
- [ ] Validate against sample data
- [ ] Document any issues found

## Execution Order

1. **Start with Phase 1** - Get foundation ready
2. **Move to Phase 2** - Build core functionality
3. **Quick test** after step 7 to verify basics work
4. **Phase 3** - Add output capabilities
5. **Phase 4** - Validate with small dataset
6. **Phase 5** - Scale to full dataset

## Time Estimates

- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 30 minutes
- Phase 4: 20 minutes
- Phase 5: 30 minutes

**Total: ~2.5 hours for MVP**

## API Response Structure Reference

```json
{
  "items": [
    {
      "id": "string (UUID)",
      "title": "string",
      "description": "string",
      "uri": "string (relative path)",
      "url": "string (full URL)",
      "type": "number (always 110)",
      "categoryId": "string (UUID)",
      "labels": [
        {
          "id": "string (UUID)",
          "sortOrder": "number"
        }
      ],
      "resolution": "number (110, 111, 112, 114, 116)",
      "readingTimeInMinutes": "number",
      "creationDate": "number (milliseconds since epoch)",
      "docType": "string (ANSWERS_ARTICLE)"
    }
  ],
  "itemsCount": "number (total items available)",
  "searchMethod": "string (Answers)"
}
```

## Output Schema

```javascript
{
  id: string,
  title: string,
  description: string,
  url: string,
  resolution: string,         // "Collecting votes", "Planned", etc.
  resolutionCode: number,     // 110, 111, 112, 114, 116
  status: string,            // Same as resolution
  creationDate: string,      // ISO date format
  readingTime: number,
  categories: string[],      // ["Wix Stores", "Wix Blog", etc.]
  categoryIds: string[],     // Original label IDs
  type: number,
  docType: string
}
```

## Success Criteria

- [ ] Scraper runs without errors
- [ ] All 2000+ items collected
- [ ] CSV output is properly formatted
- [ ] Data is accurately transformed
- [ ] Categories are correctly mapped
- [ ] Dates are human-readable
- [ ] No duplicate items in output