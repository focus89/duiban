const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const worksCollection = db.collection('works')
const _ = db.command

exports.main = async (event, context) => {
  const { filter = {} } = event
  const wxContext = cloud.getWXContext()

  console.log('开始获取作品列表，过滤条件:', filter)
  console.log('当前用户 OPENID:', wxContext.OPENID)

  try {
    // 构建查询条件
    const query = {
      isDraft: false,  // 非草稿
      isPublished: true  // 已发布
    }

    // 如果指定了用户ID，则查询该用户的作品
    if (filter.userId) {
      query._openid = filter.userId;  // 使用 _openid 而不是 userId
      console.log('查询特定用户的作品:', filter.userId);
    }

    // 如果有其他过滤条件，添加到查询中
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.tags && filter.tags.length > 0) {
      query.tags = _.in(filter.tags);
    }

    console.log('最终查询条件:', query)

    // 查询作品列表
    const result = await worksCollection
      .where(query)
      .orderBy('updateTime', 'desc')
      .get()

    console.log('查询结果:', result.data)

    // 处理作品数据
    const works = result.data.map(work => ({
      _id: work._id, // 保留原始_id
      id: work._id,
      title: work.title || '未命名作品',
      description: work.description || '',
      coverImage: work.coverImage || '',
      pages: work.pages || [],
      author: {
        id: work._openid,
        name: work.userName || '未知用户',
        avatarUrl: work.userAvatarUrl || ''
      },
      stats: {
        views: work.stats?.views || 0,
        likes: work.stats?.likes || 0,
        comments: work.stats?.comments || 0,
        shares: work.stats?.shares || 0
      },
      createTime: work.createTime || Date.now(),
      updateTime: work.updateTime || Date.now()
    }))

    console.log('处理后的作品数据:', works)

    return {
      success: true,
      works,
      total: works.length
    }
  } catch (error) {
    console.error('获取作品列表失败:', error)
    return {
      success: false,
      error: error.message || '获取作品列表失败'
    }
  }
} 