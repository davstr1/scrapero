const fs = require('fs').promises;
const path = require('path');

async function validateDuplicates() {
  console.log('=== Duplicate Validation Report ===\n');
  
  try {
    // Check CSV file
    const csvPath = path.join(__dirname, '../../../data/apps.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const csvLines = csvContent.split('\n').filter(line => line.trim());
    
    console.log('CSV Analysis:');
    console.log(`- Total lines: ${csvLines.length}`);
    console.log(`- Header line: 1`);
    console.log(`- Data rows: ${csvLines.length - 1}`);
    
    // Extract slugs from CSV
    const csvSlugs = [];
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i];
      const slug = line.split(',')[0];
      if (slug) {
        csvSlugs.push(slug);
      }
    }
    
    // Count duplicates
    const slugCounts = {};
    csvSlugs.forEach(slug => {
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
    });
    
    const duplicates = Object.entries(slugCounts)
      .filter(([slug, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`\nDuplicate Summary:`);
    console.log(`- Unique apps: ${Object.keys(slugCounts).length}`);
    console.log(`- Total duplicates: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log(`\nTop duplicates:`);
      duplicates.slice(0, 10).forEach(([slug, count]) => {
        console.log(`  - ${slug}: appears ${count} times`);
      });
    } else {
      console.log('\n✅ No duplicates found in CSV!');
    }
    
    // Check JSON file
    console.log('\n\nJSON Analysis:');
    const jsonPath = path.join(__dirname, '../../../data/apps.json');
    
    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);
      
      console.log(`- Total apps: ${jsonData.count || jsonData.apps?.length || 0}`);
      console.log(`- Timestamp: ${jsonData.timestamp || 'Not found'}`);
      
      if (jsonData.apps && Array.isArray(jsonData.apps)) {
        const jsonSlugs = jsonData.apps.map(app => app.slug);
        const uniqueJsonSlugs = [...new Set(jsonSlugs)];
        
        console.log(`- Unique apps: ${uniqueJsonSlugs.length}`);
        console.log(`- Duplicates: ${jsonSlugs.length - uniqueJsonSlugs.length}`);
        
        if (jsonSlugs.length === uniqueJsonSlugs.length) {
          console.log('\n✅ No duplicates found in JSON!');
        } else {
          console.log('\n❌ JSON contains duplicates!');
        }
      }
    } catch (error) {
      console.log('- JSON file not found or invalid');
    }
    
    // Logging function to add to scraper
    console.log('\n\nRecommended logging code to add to scraper:');
    console.log(`
function logDuplicateStats(apps) {
  const slugs = apps.map(app => app.slug);
  const uniqueSlugs = [...new Set(slugs)];
  console.log('\\nDuplicate Statistics:');
  console.log(\`- Total apps: \${slugs.length}\`);
  console.log(\`- Unique apps: \${uniqueSlugs.length}\`);
  console.log(\`- Duplicates removed: \${slugs.length - uniqueSlugs.length}\`);
  
  if (slugs.length !== uniqueSlugs.length) {
    console.warn('⚠️  WARNING: Duplicates detected in final output!');
  }
}
`);
    
  } catch (error) {
    console.error('Validation error:', error);
  }
}

validateDuplicates().catch(console.error);