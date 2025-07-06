const Utils = require('./utils');

class CategoryMapping {
  constructor() {
    // Known category structure based on Wix App Market
    this.categories = {
      'marketing': {
        name: 'Marketing',
        subcategories: {
          'ads': 'Ads',
          'mobile': 'Mobile Apps',
          'analytics': 'Analytics',
          'email-marketing': 'Email Marketing',
          'seo': 'SEO',
          'social-media': 'Social Media',
          'marketing-automation': 'Marketing Automation',
          'affiliate-marketing': 'Affiliate Marketing'
        }
      },
      'ecommerce': {
        name: 'Sell Online',
        subcategories: {
          'store-management': 'Store Management',
          'shipping': 'Shipping & Delivery',
          'payment': 'Payment Solutions',
          'inventory': 'Inventory Management',
          'product-feeds': 'Product Feeds',
          'dropshipping': 'Dropshipping',
          'print-on-demand': 'Print on Demand',
          'wholesale': 'Wholesale & B2B'
        }
      },
      'booking--events': {
        name: 'Services & Events',
        subcategories: {
          'scheduling': 'Scheduling & Booking',
          'ticketing': 'Event Ticketing',
          'calendar': 'Calendar & Availability',
          'classes': 'Classes & Courses',
          'appointments': 'Appointments',
          'rentals': 'Rentals & Resources'
        }
      },
      'communication': {
        name: 'Communication',
        subcategories: {
          'chat': 'Live Chat',
          'forms': 'Forms & Surveys',
          'crm': 'CRM',
          'help-desk': 'Help Desk',
          'testimonials': 'Reviews & Testimonials',
          'community': 'Community & Forum',
          'notifications': 'Notifications'
        }
      },
      'design-elements': {
        name: 'Design Elements',
        subcategories: {
          'galleries': 'Galleries & Slideshows',
          'video': 'Video',
          'audio': 'Audio & Music',
          'effects': 'Visual Effects',
          'widgets': 'Widgets',
          'menus': 'Menus & Navigation',
          'popups': 'Popups & Modals'
        }
      },
      'media--content': {
        name: 'Media & Content',
        subcategories: {
          'blog': 'Blog',
          'podcast': 'Podcast',
          'portfolio': 'Portfolio',
          'file-sharing': 'File Sharing',
          'translation': 'Translation',
          'content-import': 'Content Import',
          'rss': 'RSS & News Feeds'
        }
      }
    };
  }

  getCategoryName(slug) {
    return this.categories[slug]?.name || this.prettifySlug(slug);
  }

  getSubcategoryName(categorySlug, subcategorySlug) {
    return this.categories[categorySlug]?.subcategories[subcategorySlug] || 
           this.prettifySlug(subcategorySlug);
  }

  prettifySlug(slug) {
    return slug
      .replace(/--/g, ' & ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getAllCategories() {
    return Object.entries(this.categories).map(([slug, data]) => ({
      slug,
      name: data.name,
      subcategories: Object.entries(data.subcategories).map(([subSlug, subName]) => ({
        slug: subSlug,
        name: subName,
        parentSlug: slug
      }))
    }));
  }

  async buildCategoryStructure(discoveredUrls) {
    const structure = {
      timestamp: Utils.getTimestamp(),
      categories: []
    };

    // Build structure from discovered URLs
    const categoryMap = new Map();

    // Process main categories
    for (const cat of discoveredUrls.categories) {
      const category = {
        slug: cat.slug,
        name: this.getCategoryName(cat.slug),
        url: cat.url,
        subcategories: [],
        appCount: 0
      };
      categoryMap.set(cat.slug, category);
      structure.categories.push(category);
    }

    // Process subcategories
    for (const subcat of discoveredUrls.subcategories) {
      const parentCategory = categoryMap.get(subcat.parentCategory);
      if (parentCategory) {
        parentCategory.subcategories.push({
          slug: subcat.slug,
          name: this.getSubcategoryName(subcat.parentCategory, subcat.slug),
          url: subcat.url,
          parentSlug: subcat.parentCategory,
          appCount: 0
        });
      }
    }

    // Count apps per category/subcategory
    for (const app of discoveredUrls.apps) {
      const category = categoryMap.get(app.category);
      if (category) {
        category.appCount++;
      }
    }

    // Calculate totals
    structure.totalCategories = structure.categories.length;
    structure.totalSubcategories = structure.categories.reduce(
      (sum, cat) => sum + cat.subcategories.length, 0
    );
    structure.totalApps = discoveredUrls.apps.length;

    return structure;
  }

  async saveCategoryStructure(structure) {
    const config = require('../config.json');
    await Utils.writeJsonFile(config.output.categoriesFile, structure);
    
    console.log('\nCategory Structure:');
    console.log(`Total Categories: ${structure.totalCategories}`);
    console.log(`Total Subcategories: ${structure.totalSubcategories}`);
    console.log(`Total Apps: ${structure.totalApps}`);
    
    console.log('\nCategories:');
    for (const cat of structure.categories) {
      console.log(`\n${cat.name} (${cat.slug})`);
      console.log(`  URL: ${cat.url}`);
      console.log(`  Apps: ${cat.appCount}`);
      console.log(`  Subcategories: ${cat.subcategories.length}`);
      
      if (cat.subcategories.length > 0) {
        for (const subcat of cat.subcategories) {
          console.log(`    - ${subcat.name} (${subcat.slug})`);
        }
      }
    }
  }
}

module.exports = CategoryMapping;