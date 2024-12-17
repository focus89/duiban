// 用户信息接口
export interface UserInfo {
  id: string
  nickname: string
  avatar: string
  gender: number
  country: string
  province: string
  city: string
  language: string
}

// 作品对象接口
export interface WorkItem {
  id: string
  title: string
  description: string
  coverImage: string
  pages: WorkPage[]
  author: {
    id: string
    nickname: string
    avatar: string
  }
  stats: {
    likes: number
    comments: number
    shares: number
  }
  createdAt: string
  updatedAt: string
}

// 作品页面接口
export interface WorkPage {
  id: string
  elements: WorkElement[]
  background: {
    type: 'color' | 'image'
    value: string
  }
  audio?: {
    type: 'bgm' | 'effect'
    src: string
    loop: boolean
  }
}

// 作品元素接口
export interface WorkElement {
  id: string
  type: 'image' | 'text' | 'shape'
  content: string
  style: {
    x: number
    y: number
    width: number
    height: number
    rotate: number
    opacity: number
    zIndex: number
  }
  properties: {
    [key: string]: any
  }
  audio?: {
    src: string
    trigger: 'click' | 'auto'
  }
}

// 评论接口
export interface Comment {
  id: string
  content: string
  author: {
    id: string
    nickname: string
    avatar: string
  }
  createdAt: string
  replies?: Comment[]
}

// 素材接口
export interface Material {
  id: string
  type: 'image' | 'audio'
  category: string
  name: string
  url: string
  thumbnail?: string
  author: {
    id: string
    nickname: string
  }
  prompt?: string
  tags: string[]
  createdAt: string
}

// API响应接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数接口
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

// 分页响应接口
export interface PaginatedResponse<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

// AI生成参数接口
export interface AIGenerateParams {
  type: 'image' | 'audio'
  prompt: string
  style?: string
  size?: string
  duration?: number
}

// 系统设置接口
export interface Settings {
  theme: 'light' | 'dark'
  language: 'zh_CN' | 'en_US'
  autoPlay: boolean
  showDanmaku: boolean
  volume: number
} 