const StorageKey = {
  TOKEN: 'token',
  USER_INFO: 'userInfo'
}

const storage = {
  get(key: string) {
    return wx.getStorageSync(key)
  },

  set(key: string, data: any) {
    wx.setStorageSync(key, data)
  },

  remove(key: string) {
    wx.removeStorageSync(key)
  },

  clear() {
    wx.clearStorageSync()
  }
}

module.exports = {
  storage,
  StorageKey
} 