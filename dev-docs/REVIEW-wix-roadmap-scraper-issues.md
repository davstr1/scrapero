# Wix Roadmap Scraper - Critical Issues Found

## Problem
The current implementation has a fundamental flaw in how it queries the API, resulting in incomplete data collection.

### What's Wrong
1. **Current approach**: Sending ALL 56 label IDs in a single API request
2. **Result**: Only getting 856 items instead of the expected 2041 items
3. **Root cause**: The API appears to limit results when too many label IDs are requested simultaneously

### What the Instructions Actually Say
From the original instructions:
- "hasAnyOfLabelIds[] = label id we want to target. (the idea perhaps, is to target labels ids one by one.)"

This clearly suggests iterating through each label ID separately, not sending them all at once.

## Required Changes

### 1. Modify API Fetching Strategy
Instead of:
```javascript
// Current - sends all 56 labels at once
this.labelIds.forEach(labelId => {
  params.append('hasAnyOfLabelIds[]', labelId);
});
```

Should be:
```javascript
// Iterate through each label ID separately
for (const labelId of this.labelIds) {
  // Fetch all pages for this specific label
  const items = await fetchAllPagesForLabel(labelId);
}
```

### 2. Handle Deduplication Across Labels
Since items can have multiple labels, we'll see the same item multiple times when fetching by individual labels. The deduplication logic is already in place and should handle this.

### 3. Expected Behavior
- Make 56 separate paginated API calls (one per label)
- Each call fetches all items for that specific label
- Deduplicate across all fetches
- Should result in ~2041 unique items total

## Impact
Without this fix:
- We're missing ~60% of the data (1185 items)
- The dataset is incomplete and not useful for analysis
- We're not getting items that might only have certain label combinations

## Action Items
1. Refactor api-fetcher.js to iterate through labels individually
2. Add progress tracking per label
3. Test with a few labels first to verify we get more data
4. Run full scrape with all 56 labels
5. Verify we get close to 2041 total items