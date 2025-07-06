const CATEGORY_MAPPINGS = {
  // Marketing
  'facebook': 'Marketing',
  'instagram': 'Marketing',
  'tiktok': 'Marketing',
  'google': 'Marketing',
  'seo': 'Marketing',
  'email': 'Marketing',
  'social': 'Marketing',
  'analytics': 'Marketing',
  'ads': 'Marketing',
  'conversion': 'Marketing',
  'engagement': 'Marketing',
  
  // eCommerce
  'wix-stores': 'eCommerce',
  'stores': 'eCommerce',
  'shop': 'eCommerce',
  'cart': 'eCommerce',
  'product': 'eCommerce',
  'shipping': 'eCommerce',
  'payment': 'eCommerce',
  'checkout': 'eCommerce',
  'inventory': 'eCommerce',
  'dropshipping': 'eCommerce',
  'spocket': 'eCommerce',
  
  // Business Services
  'bookings': 'Business Services',
  'events': 'Business Services',
  'loyalty': 'Business Services',
  'challenges': 'Business Services',
  'wix-music': 'Business Services',
  'connecteam': 'Business Services',
  'quickbooks': 'Business Services',
  'invoice': 'Business Services',
  'accounting': 'Business Services',
  'crm': 'Business Services',
  
  // Communication
  'chat': 'Communication',
  'whatsapp': 'Communication',
  'messenger': 'Communication',
  'call': 'Communication',
  'contact': 'Communication',
  'form': 'Communication',
  'comments': 'Communication',
  'reviews': 'Communication',
  
  // Design & Content
  'photo': 'Design & Content',
  'image': 'Design & Content',
  'gallery': 'Design & Content',
  'video': 'Design & Content',
  'animation': 'Design & Content',
  'text': 'Design & Content',
  'typewriter': 'Design & Content',
  'content': 'Design & Content',
  'ai': 'Design & Content',
  
  // Site Management
  'password': 'Site Management',
  'privacy': 'Site Management',
  'gdpr': 'Site Management',
  'cookie': 'Site Management',
  'blocker': 'Site Management',
  'protection': 'Site Management',
  'security': 'Site Management',
  'age-verification': 'Site Management',
  
  // Tools & Widgets
  'map': 'Tools & Widgets',
  'calculator': 'Tools & Widgets',
  'countdown': 'Tools & Widgets',
  'timer': 'Tools & Widgets',
  'weather': 'Tools & Widgets',
  'currency': 'Tools & Widgets',
  'search': 'Tools & Widgets',
  'clock': 'Tools & Widgets',
  'chart': 'Tools & Widgets',
  
  // Developer Tools
  'code': 'Developer Tools',
  'api': 'Developer Tools',
  'embed': 'Developer Tools',
  'integration': 'Developer Tools',
  'webhook': 'Developer Tools'
};

// Main categories from Wix sidebar
const MAIN_CATEGORIES = [
  'Marketing',
  'eCommerce', 
  'Business Services',
  'Communication',
  'Design & Content',
  'Site Management',
  'Tools & Widgets',
  'Developer Tools'
];

class CategoryMapper {
  static detectCategory(appData) {
    const { slug, name, description = '' } = appData;
    
    // Check slug first
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
      if (slug.toLowerCase().includes(keyword)) {
        return category;
      }
    }
    
    // Check name
    const nameLower = name.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
    
    // Check description
    const descLower = description.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
      if (descLower.includes(keyword)) {
        return category;
      }
    }
    
    // Default category
    return 'Other';
  }
  
  static getAllCategories() {
    return MAIN_CATEGORIES;
  }
}

module.exports = CategoryMapper;