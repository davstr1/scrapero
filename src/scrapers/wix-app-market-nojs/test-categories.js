const CategoryMapper = require('./lib/category-mapper');

// Test apps with expected categories
const testApps = [
  { slug: 'wix-stores', name: 'Wix Stores', description: 'Professional eCommerce platform to sell online', expected: 'eCommerce' },
  { slug: 'bookings', name: 'Wix Bookings', description: 'Scheduling platform, calendar & online booking', expected: 'Business Services' },
  { slug: 'facebook-pixel', name: 'Facebook Pixel', description: 'Track conversions and create custom audiences', expected: 'Marketing' },
  { slug: 'whatsapp-chat', name: 'WhatsApp Chat', description: 'Add WhatsApp chat button to your site', expected: 'Communication' },
  { slug: 'image-gallery', name: 'Image Gallery Pro', description: 'Beautiful photo galleries for your site', expected: 'Design & Content' },
  { slug: 'gdpr-cookie-consent', name: 'GDPR Cookie Consent', description: 'Cookie consent banner for GDPR compliance', expected: 'Site Management' },
  { slug: 'countdown-timer', name: 'Countdown Timer', description: 'Add countdown timers to your site', expected: 'Tools & Widgets' },
  { slug: 'velo-api', name: 'Velo API Integration', description: 'API integration tools for developers', expected: 'Developer Tools' },
];

console.log('Testing Category Detection\n');
console.log('='.repeat(50));

let correct = 0;
let incorrect = 0;

testApps.forEach(app => {
  const detected = CategoryMapper.detectCategory(app);
  const isCorrect = detected === app.expected;
  
  console.log(`\nApp: ${app.name}`);
  console.log(`Slug: ${app.slug}`);
  console.log(`Expected: ${app.expected}`);
  console.log(`Detected: ${detected}`);
  console.log(`Result: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}`);
  
  if (isCorrect) {
    correct++;
  } else {
    incorrect++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\nSummary:`);
console.log(`Correct: ${correct}/${testApps.length} (${(correct/testApps.length*100).toFixed(1)}%)`);
console.log(`Incorrect: ${incorrect}/${testApps.length}`);

console.log('\n\nAll Categories:');
CategoryMapper.getAllCategories().forEach(cat => {
  console.log(`- ${cat}`);
});