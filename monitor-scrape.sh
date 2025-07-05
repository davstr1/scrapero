#!/bin/bash
# Monitor WordPress scraper progress

echo "🚀 Monitoring WordPress Commercial Plugins Scrape..."
echo "============================================="

while true; do
    # Check if scraper is still running
    if ps aux | grep -E "tsx.*wordpress-plugins" | grep -v grep > /dev/null; then
        # Get CSV line count
        LINES=$(wc -l < "/Users/imac1/Documents/code2024/marketplace_scrapers/exports/wordpress-commercial-plugins-2025-07-05.csv" 2>/dev/null || echo "0")
        PLUGINS=$((LINES - 1))
        
        # Get latest page from log
        LATEST_PAGE=$(tail -100 wordpress-scrape.log | grep "Page [0-9]*: Extracted" | tail -1 | grep -o "Page [0-9]*" | grep -o "[0-9]*" || echo "1")
        
        # Calculate progress
        ESTIMATED_TOTAL=600
        PERCENT=$((PLUGINS * 100 / ESTIMATED_TOTAL))
        
        echo -ne "\r📊 Progress: $PLUGINS/$ESTIMATED_TOTAL plugins ($PERCENT%) | Page: $LATEST_PAGE/35 | Status: Running... "
    else
        echo -e "\n✅ Scraper completed!"
        FINAL_COUNT=$(($(wc -l < "/Users/imac1/Documents/code2024/marketplace_scrapers/exports/wordpress-commercial-plugins-2025-07-05.csv") - 1))
        echo "📈 Final count: $FINAL_COUNT plugins"
        break
    fi
    
    sleep 5
done