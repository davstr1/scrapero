#!/bin/bash

# Monitor the full WordPress plugin scraping progress

echo "=== WordPress Plugin Scraper Monitor ==="
echo "Total plugins to scrape: 106,991"
echo ""

# Check if process is running
if pgrep -f "node index.js full" > /dev/null; then
    echo "✅ Scraper is RUNNING"
else
    echo "❌ Scraper is NOT running"
fi

echo ""

# Check progress file
PROGRESS_FILE="temp/scrape-progress.json"
if [ -f "$PROGRESS_FILE" ]; then
    echo "📊 Current Progress:"
    cat "$PROGRESS_FILE" | python3 -m json.tool
    
    # Extract progress percentage
    LAST_INDEX=$(cat "$PROGRESS_FILE" | grep -o '"lastIndex": [0-9]*' | grep -o '[0-9]*')
    if [ ! -z "$LAST_INDEX" ]; then
        PERCENTAGE=$(echo "scale=2; ($LAST_INDEX / 106991) * 100" | bc)
        echo ""
        echo "Progress: $LAST_INDEX / 106,991 ($PERCENTAGE%)"
        
        # Estimate time remaining (assuming ~1 second per plugin)
        REMAINING=$((106991 - $LAST_INDEX))
        HOURS=$((REMAINING / 3600))
        MINUTES=$(((REMAINING % 3600) / 60))
        echo "Estimated time remaining: ${HOURS}h ${MINUTES}m"
    fi
else
    echo "No progress file found yet..."
fi

echo ""

# Check output file
OUTPUT_FILE="output/wordpress-plugins-svn.csv"
if [ -f "$OUTPUT_FILE" ]; then
    LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
    echo "📁 Output file: $LINE_COUNT lines"
    
    # Show last few scraped plugins
    echo ""
    echo "Last 5 scraped plugins:"
    tail -5 "$OUTPUT_FILE" | cut -d',' -f1,2 | sed 's/,/ - /'
fi

echo ""

# Check failed plugins
FAILED_FILE="temp/failed-plugins.csv"
if [ -f "$FAILED_FILE" ]; then
    FAILED_COUNT=$(wc -l < "$FAILED_FILE")
    echo "❌ Failed plugins: $((FAILED_COUNT - 1))"
fi

echo ""
echo "Last updated: $(date)"