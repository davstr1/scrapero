# Wix App Market Category Extraction Methodology

## Date: 2025-07-06

## Summary
After thorough analysis of the Wix App Market HTML structure, I've discovered that app categories are NOT embedded in individual app detail pages. Instead, they're determined by the app's position in the site's navigation hierarchy.

## Key Findings

### 1. Current Implementation Issue
- The existing CategoryMapper uses keyword-based guessing instead of extracting actual categories
- This leads to incorrect categorization (e.g., Wix Groups shows as "Other" instead of "Communication/Community")

### 2. HTML Structure Analysis
- Individual app pages (like wix-groups) do NOT contain category data in the HTML
- Categories are shown in the sidebar navigation structure
- The app being viewed is marked as "selected" in the sidebar
- Categories visible to users come from the navigation context, not the app detail HTML

### 3. Category Hierarchy
Found the following structure in the sidebar:
- Main categories: Marketing, eCommerce, Communication, etc.
- Subcategories: Under Communication -> Community, Live Chat, etc.
- Example: Wix Groups appears under Communication > Community in the navigation

### 4. Technical Challenge
Since categories aren't in the app detail HTML, we cannot extract them using the current scraping approach. The categories users see are determined by:
1. Which category page the app appears on
2. The navigation path to reach the app
3. Potentially JavaScript-rendered content

## Possible Solutions

### Option 1: Scrape Category Pages
1. Scrape each category listing page (e.g., /app-market/category/communication)
2. Build a mapping of app-slug to categories
3. Use this mapping during individual app scraping

### Option 2: Extract from URL Structure
1. When scraping apps, check if they come from category URLs
2. Parse the category from the referrer URL
3. Limitation: Only works if we navigate via category pages

### Option 3: Use Search/API
1. Check if Wix has an API or search endpoint that returns category data
2. Make additional requests to get category information

### Option 4: Accept Limitation
1. Document that categories cannot be reliably extracted from individual app pages
2. Continue with keyword-based approximation but improve the mappings
3. Add a data quality note about category accuracy

## Recommendation
The most reliable approach would be Option 1 - scraping category pages first to build a complete app-to-category mapping. This would ensure accurate category data for all apps.

## Current Status
- Keyword-based category detection is functional but inaccurate
- Need to decide on approach before implementing proper category extraction
- Current CSV output includes approximated categories marked as "Category"