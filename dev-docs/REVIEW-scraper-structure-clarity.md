# Review: Scraper Structure & Data Export Organization

## Current State Analysis

### 1. CSV File Chaos
Found 33 CSV files scattered across the codebase in inconsistent locations:
- **Root data folder**: `./data/apps.csv` (the deduplicated Wix data)
- **Exports folder**: 8 WordPress-related CSV files with various test stages
- **Individual scraper data folders**: 
  - `./src/scrapers/wix-app-market-nojs/data/` (3 CSV files)
  - `./src/scrapers/wix-roadmap/data/wix-roadmap/` (2 timestamped files)
- **Temp folders**: 21 CSV files in `./src/scrapers/wordpress-plugins-svn/temp/`

### 2. Inconsistent Folder Structures
Each scraper has its own unique structure:
- **wix-app-market-nojs**: Has `data/`, `debug/`, `analysis/` folders
- **wix-roadmap**: Has `data/wix-roadmap/` (redundant nesting)
- **wordpress-plugins-svn**: Has `temp/` and `output/` folders
- **wix-app-market**: Has `output/` and `temp/` folders

### 3. Export Patterns Are All Over The Place
- Some scrapers export to their own `data/` folder
- Some use `temp/` folders (which shouldn't be for final outputs)
- Some use `output/` folders
- Global exports go to `./exports/` folder
- One consolidated file in `./data/`

### 4. No Clear Naming Conventions
- Some files include timestamps: `wix-roadmap-2025-07-08T11-10-11.csv`
- Some include stage info: `test-5-plugins.csv`, `first-30-svn.csv`
- Some are generic: `apps.csv`, `combined-output.csv`

## Problems This Creates

1. **Impossible to find data**: Where is the latest scrape? Is it in data/, exports/, or the scraper's folder?
2. **Duplication confusion**: Multiple `apps.csv` files - which is the source of truth?
3. **Temp files persist**: 21 files in temp folders that should be ephemeral
4. **No clear data flow**: From raw scrape → processed → consolidated

## Recommended Structure

### 1. Global Output Directory Structure
```
outputs/           # Better name than 'data' - clearly indicates these are outputs
├── raw/          # Raw scraper outputs
│   ├── wix-app-market/
│   │   └── 2025-07-08-111058.csv
│   ├── wix-roadmap/
│   │   └── 2025-07-08-111058.csv
│   └── wordpress-plugins/
│       └── 2025-07-08-111058.csv
├── processed/    # Cleaned/deduplicated data
│   ├── wix-apps-dedup.csv
│   └── wordpress-plugins-dedup.csv
└── consolidated/ # Cross-marketplace consolidated data
    └── all-marketplaces.csv
```

### 2. Individual Scraper Structure
```
src/scrapers/{scraper-name}/
├── index.js         # Main entry point
├── config.json      # Configuration
├── lib/            # Core logic
├── tests/          # Tests
├── README.md       # Documentation
└── .temp/          # Temporary files (gitignored)
```

### 3. Clear Data Flow
1. Scrapers write to `outputs/raw/{scraper-name}/`
2. Post-processing writes to `outputs/processed/`
3. Consolidation writes to `outputs/consolidated/`

### 4. Naming Conventions
- Raw outputs: `{scraper-name}-{YYYY-MM-DD-HHMMSS}.{format}`
- Processed: `{marketplace}-{data-type}-processed.{format}`
- Consolidated: `{scope}-consolidated.{format}`

## Claude.md Instructions for Scraper Development

### Required Scraper Structure
Every scraper MUST follow this structure:
1. Use BaseScraper class (already exists)
2. Export to `outputs/raw/{scraper-name}/` with timestamp
3. Keep temporary files in `.temp/` (gitignored)
4. Document fields in README.md

### Data Export Rules
1. **Never** write CSVs inside scraper directories
2. **Always** use timestamped filenames for raw outputs
3. **Always** export to `outputs/raw/{scraper-name}/`
4. **Never** commit temp files

### Post-Processing
1. Deduplication scripts read from `outputs/raw/`
2. Write processed data to `outputs/processed/`
3. Clear field mapping to consolidated schema

## Action Items

1. **Migrate existing data**:
   - Move all CSVs to new structure
   - Clean up temp folders
   - Update scraper configs

2. **Update scrapers**:
   - Modify export paths
   - Remove local data folders
   - Update documentation

3. **Create utilities**:
   - Data consolidation script
   - Deduplication utilities
   - Field mapping configurations

4. **Update CLAUDE.md**:
   - Add scraper development guide
   - Add data export rules
   - Add naming conventions

This structure will make it crystal clear where data lives and how it flows through the system.