# Subcategory Data Model Design

## Current App Data Structure

```javascript
{
  slug: string,
  url: string,
  name: string,
  category: string,  // Currently using keyword-based detection
  rating: number,
  reviewCount: number,
  installs: string,
  developer: string,
  description: string,
  features: string[],
  hasFreeVersion: boolean,
  tiers: object[],
  icon: string,
  screenshots: string[],
  tags: string[],
  lastUpdated: string,
  scrapedAt: string
}
```

## Proposed Subcategory Extension

### Option 1: Simple Array (Recommended)
```javascript
{
  // ... existing fields ...
  category: string,  // Keep for backward compatibility
  subcategories: [
    {
      id: string,        // e.g., "accounting", "ads"
      displayName: string, // e.g., "Contabilidad", "Ads"
      parentCategory: string, // e.g., "ecommerce", "marketing"
      url: string        // Full subcategory URL
    }
  ]
}
```

### Option 2: Nested Structure
```javascript
{
  // ... existing fields ...
  categories: {
    main: string,      // Primary category
    sub: [
      {
        id: string,
        displayName: string,
        parentCategory: string,
        url: string
      }
    ]
  }
}
```

## Decision: Option 1 (Simple Array)

Reasons:
- Maintains backward compatibility with existing `category` field
- Simple and flat structure (KISS principle)
- Easy to extend without breaking existing code
- Clear separation of concerns

## Selector Strategy

### Primary Selector
```javascript
const subcategorySelector = '[data-hook^="subcategory-tag-button-"]';
```

### Fallback Selector
```javascript
const fallbackSelector = '[data-hook="categories-tags"] a[href*="subCat="]';
```

### Differentiation Logic
```javascript
// Category buttons have: data-hook="category-tag-button-{name}"
// Subcategory buttons have: data-hook="subcategory-tag-button-{name}"
const isSubcategory = (element) => {
  const dataHook = element.attr('data-hook') || '';
  return dataHook.startsWith('subcategory-tag-button-');
};
```

## Edge Cases

1. **No Subcategories**: `subcategories` will be an empty array
2. **Multiple Subcategories**: All will be captured in the array
3. **Different Parent Categories**: Each subcategory stores its parent
4. **Missing Data Hooks**: Fallback to URL pattern matching
5. **Internationalization**: Display names vary by locale, IDs remain consistent

## Implementation Notes

- Subcategory extraction should happen in the same pass as category extraction
- Use cheerio's powerful selectors for efficient extraction
- Maintain consistency with existing extraction patterns
- Log warnings but don't fail if subcategories can't be extracted