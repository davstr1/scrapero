#!/bin/bash

echo "Monitoring WordPress plugins full scrape..."
echo "Press Ctrl+C to stop monitoring"
echo ""

CSV_FILE="exports/wordpress-plugins-full-scrape-2025-07-05.csv"

while true; do
    if [ -f "$CSV_FILE" ]; then
        COUNT=$(wc -l < "$CSV_FILE")
        PLUGINS=$((COUNT - 1))  # Subtract header row
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$TIMESTAMP] Scraped plugins: $PLUGINS"
    else
        echo "CSV file not found yet..."
    fi
    sleep 10
done