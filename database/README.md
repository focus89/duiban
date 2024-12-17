# 数据库集合说明

## works 集合
存储作品信息，包含以下字段：
- _id: 作品ID
- title: 作品标题
- author: 作者信息
  - id: 作者ID
  - name: 作者名称
  - avatar: 作者头像
- pages: 页面数组
  - id: 页面ID
  - elements: 元素数组
    - id: 元素ID
    - type: 元素类型 (image/shape/text/audio)
    - x: X坐标
    - y: Y坐标
    - width: 宽度
    - height: 高度
    - zIndex: 层级
    - rotation: 旋转角度
    - 其他特定类型的属性
  - relations: 元素关系数组
  - backgroundColor: 背景颜色
  - transition: 过渡动画配置
- createTime: 创建时间
- updateTime: 更新时间
- stats: 统计信息
  - views: 浏览数
  - likes: 点赞数
  - shares: 分享数
- tags: 标签数组
- visibility: 可见性 (public/private)

## users 集合
存储用户信息，包含以下字段：
- _id: 用户ID
- openId: 微信OpenID
- unionId: 微信UnionID（如果有）
- nickName: 昵称
- avatarUrl: 头像URL
- createTime: 创建时间
- updateTime: 更新时间

## 索引设置
1. works集合索引：
   - updateTime: -1（用于按时间排序）
   - visibility: 1（用于筛选公开作品）
   - 'author.id': 1（用于查询用户作品）
   - tags: 1（用于标签搜索）

2. users集合索引：
   - openId: 1（唯一索引）
   - unionId: 1（如果有）

## 素材集合 (materials)

```json
{
  "_id": "string",
  "url": "string",
  "name": "string",
  "author": {
    "id": "string",
    "nickname": "string",
    "avatar": "string"
  },
  "category": "string",
  "tags": ["string"],
  "createTime": "number"
}
```

## 索引设计

### works 集合索引
- author.id: 1
- createTime: -1
- updateTime: -1
- visibility: 1
- tags: 1

### materials 集合索引
- category: 1
- createTime: -1
- tags: 1
- name: "text" 