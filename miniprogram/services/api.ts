const { request } = require('../utils/api')
const { storage, StorageKey } = require('../utils/storage')

// 用户相关API
const userApi = {
  // 登录
  login: (code: string) => {
    return request.post<{ token: string; userInfo: any }>('/user/login', { code })
  },

  // 更新用户信息
  updateUserInfo: (userInfo: any) => {
    return request.put<any>('/user/info', userInfo)
  },

  // 获取用户信息
  getUserInfo: (userId: string) => {
    return request.get<any>(`/user/${userId}`)
  }
}

// 作品相关API
const workApi = {
  // 获取作品列表
  getWorkList: (params: any) => {
    return request.get<any>('/work/list', params)
  },

  // 获取作品详情
  getWorkDetail: (workId: string) => {
    return request.get<any>(`/work/${workId}`)
  },

  // 创建作品
  createWork: (work: any) => {
    return request.post<any>('/work/create', work)
  },

  // 更新作品
  updateWork: (workId: string, work: any) => {
    return request.put<any>(`/work/${workId}`, work)
  },

  // 删除作品
  deleteWork: (workId: string) => {
    return request.delete(`/work/${workId}`)
  },

  // 点赞作品
  likeWork: (workId: string) => {
    return request.post(`/work/${workId}/like`)
  },

  // 取消点赞
  unlikeWork: (workId: string) => {
    return request.delete(`/work/${workId}/like`)
  }
}

// 评论相关API
const commentApi = {
  // 获取评论列表
  getCommentList: (workId: string, params: any) => {
    return request.get<any>(`/work/${workId}/comments`, params)
  },

  // 发表评论
  createComment: (workId: string, content: string) => {
    return request.post<any>(`/work/${workId}/comment`, { content })
  },

  // 删除评论
  deleteComment: (workId: string, commentId: string) => {
    return request.delete(`/work/${workId}/comment/${commentId}`)
  }
}

// 素材相关API
const materialApi = {
  // 获取素材列表
  getMaterialList: (params: any) => {
    return request.get<any>('/material/list', params)
  },

  // 上传素材
  uploadMaterial: (file: WechatMiniprogram.UploadFileOption) => {
    return new Promise<any>((resolve, reject) => {
      wx.uploadFile({
        ...file,
        url: request.getFullUrl('/material/upload'),
        name: 'file',
        header: {
          'Authorization': `Bearer ${storage.get(StorageKey.TOKEN)}`
        },
        success: (res) => {
          resolve(JSON.parse(res.data))
        },
        fail: reject
      })
    })
  },

  // 删除素材
  deleteMaterial: (materialId: string) => {
    return request.delete(`/material/${materialId}`)
  }
}

// AI生成相关API
const aiApi = {
  // 生成图片
  generateImage: (params: any) => {
    return request.post<any>('/ai/generate/image', params)
  },

  // 生成音频
  generateAudio: (params: any) => {
    return request.post<any>('/ai/generate/audio', params)
  }
}

module.exports = {
  userApi,
  workApi,
  commentApi,
  materialApi,
  aiApi
} 