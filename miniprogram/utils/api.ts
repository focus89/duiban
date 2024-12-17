const { storage, StorageKey } = require('./storage')

// 使用本地开发服务器
const BASE_URL = 'http://localhost:3000/api'

const request = {
  getFullUrl(path: string) {
    return `${BASE_URL}${path}`
  },

  async request<T>(method: string, url: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.getFullUrl(url),
        method: method as any,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.get(StorageKey.TOKEN)}`
        },
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  get<T>(url: string, params?: any): Promise<T> {
    const queryString = params ? '?' + Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&') : ''
    return this.request('GET', url + queryString)
  },

  post<T>(url: string, data?: any): Promise<T> {
    return this.request('POST', url, data)
  },

  put<T>(url: string, data?: any): Promise<T> {
    return this.request('PUT', url, data)
  },

  delete<T>(url: string): Promise<T> {
    return this.request('DELETE', url)
  }
}

module.exports = {
  request
} 