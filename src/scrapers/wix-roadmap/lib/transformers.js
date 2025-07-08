const { getResolutionName, getCategoryNames } = require('./mappings');

function transformItem(item) {
  // Validate required fields
  if (!item.id || !item.title || !item.url) {
    console.warn('Item missing required fields:', {
      id: item.id,
      hasTitle: !!item.title,
      hasUrl: !!item.url
    });
  }
  
  // Transform the item to our schema
  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    url: item.url || '',
    resolution: getResolutionName(item.resolution),
    resolutionCode: item.resolution,
    status: getResolutionName(item.resolution), // Same as resolution
    creationDate: formatDate(item.creationDate),
    readingTime: item.readingTimeInMinutes || 0,
    categories: getCategoryNames(item.labels || []),
    categoryIds: (item.labels || []).map(label => label.id),
    type: item.type,
    docType: item.docType || 'ANSWERS_ARTICLE'
  };
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  
  try {
    // Convert milliseconds to ISO string
    const date = new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    console.warn('Invalid date timestamp:', timestamp);
    return '';
  }
}

function transformBatch(items) {
  if (!Array.isArray(items)) {
    console.error('transformBatch expects an array');
    return [];
  }
  
  return items.map(item => {
    try {
      return transformItem(item);
    } catch (error) {
      console.error('Error transforming item:', error.message, item.id);
      return null;
    }
  }).filter(item => item !== null);
}

// Validate transformed data
function validateTransformedItem(item) {
  const requiredFields = ['id', 'title', 'url', 'resolution', 'creationDate'];
  const missingFields = requiredFields.filter(field => !item[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Item ${item.id} missing fields:`, missingFields);
    return false;
  }
  
  return true;
}

module.exports = {
  transformItem,
  transformBatch,
  validateTransformedItem
};