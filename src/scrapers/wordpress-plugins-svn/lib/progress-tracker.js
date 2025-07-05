const fs = require('fs');
const path = require('path');

class ProgressTracker {
  constructor(totalItems, progressFile) {
    this.totalItems = totalItems;
    this.progressFile = progressFile;
    this.startTime = Date.now();
    this.processedItems = 0;
    this.failedItems = 0;
    this.lastSaveTime = Date.now();
  }

  update(processed, failed = 0) {
    this.processedItems = processed;
    this.failedItems = failed;
    
    // Save progress every 30 seconds
    if (Date.now() - this.lastSaveTime > 30000) {
      this.save();
      this.lastSaveTime = Date.now();
    }
  }

  save() {
    const progress = {
      totalItems: this.totalItems,
      processedItems: this.processedItems,
      failedItems: this.failedItems,
      startTime: this.startTime,
      lastUpdate: Date.now(),
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      progressPercentage: this.getProgressPercentage()
    };

    fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
  }

  load() {
    if (fs.existsSync(this.progressFile)) {
      const data = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
      this.processedItems = data.processedItems || 0;
      this.failedItems = data.failedItems || 0;
      this.startTime = data.startTime || Date.now();
      return data;
    }
    return null;
  }

  getProgressPercentage() {
    return ((this.processedItems / this.totalItems) * 100).toFixed(2);
  }

  getEstimatedTimeRemaining() {
    const elapsed = Date.now() - this.startTime;
    const itemsPerMs = this.processedItems / elapsed;
    const remainingItems = this.totalItems - this.processedItems;
    const remainingMs = remainingItems / itemsPerMs;
    
    return this.formatTime(remainingMs);
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getStats() {
    const elapsed = Date.now() - this.startTime;
    const itemsPerSecond = (this.processedItems / (elapsed / 1000)).toFixed(2);
    
    return {
      processed: this.processedItems,
      failed: this.failedItems,
      total: this.totalItems,
      percentage: this.getProgressPercentage(),
      elapsed: this.formatTime(elapsed),
      remaining: this.getEstimatedTimeRemaining(),
      speed: `${itemsPerSecond} items/sec`
    };
  }
}

module.exports = ProgressTracker;