const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const worksCollection = db.collection('works')

exports.main = async (event, context) => {
  const { id } = event
  const wxContext = cloud.getWXContext()

  try {
    // 获取作品数据
    const result = await worksCollection.doc(id).get()
    
    if (!result.data) {
      return {
        success: false,
        error: '作品不存在'
      }
    }

    // 更新浏览量
    await worksCollection.doc(id).update({
      data: {
        'stats.views': db.command.inc(1)
      }
    })

    // 格式化返回数据
    const work = {
      ...result.data,
      id: result.data._id, // 确保 id 字段存在
      stats: {
        views: (result.data.stats?.views || 0) + 1,
        likes: result.data.stats?.likes || 0,
        shares: result.data.stats?.shares || 0
      },
      pages: result.data.pages || [],
      author: result.data.author || {
        id: '',
        name: '未知作者',
        avatar: '/images/default-avatar.png'
      },
      title: result.data.title || '未命名作品',
      updateTime: result.data.updateTime || Date.now(),
      createTime: result.data.createTime || Date.now()
    }

    return {
      success: true,
      work
    }
  } catch (error) {
    console.error('获取作品失败:', error)
    return {
      success: false,
      error: error.message || '获取作品失败'
    }
  }
} 