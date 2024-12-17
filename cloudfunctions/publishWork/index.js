// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const worksCollection = db.collection('works')
const draftsCollection = db.collection('drafts')

// 云函数入口函数
exports.main = async (event, context) => {
  const { work } = event
  const wxContext = cloud.getWXContext()

  try {
    // 如果是从草稿发布，先检查权限
    if (work.id) {
      const draft = await draftsCollection.doc(work.id).get()
      if (draft.data.userId !== wxContext.OPENID) {
        throw new Error('无权限发布此作品')
      }
    }

    // 准备作品数据
    const workData = {
      ...work,
      userId: wxContext.OPENID,
      createTime: Date.now(),
      updateTime: Date.now(),
      isDraft: false,
      stats: {
        views: 0,
        likes: 0,
        shares: 0
      }
    }
    delete workData.id // 移除草稿ID

    // 发布作品
    const result = await worksCollection.add({
      data: workData
    })

    // 如果是从草稿发布，删除原草稿
    if (work.id) {
      await draftsCollection.doc(work.id).remove()
    }

    return {
      success: true,
      id: result._id
    }
  } catch (error) {
    console.error('发布作品失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 