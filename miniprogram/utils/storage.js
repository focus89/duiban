const storage = {
  async get(key) {
    try {
      const value = wx.getStorageSync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to get storage:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      wx.setStorageSync(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to set storage:', error);
      return false;
    }
  },

  async remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('Failed to remove storage:', error);
      return false;
    }
  },

  async clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
};

module.exports = storage; 