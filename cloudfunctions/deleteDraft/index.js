// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const draftsCollection = db.collection('drafts')

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event
  const wxContext = cloud.getWXContext()

  try {
    // 检查草稿是否存在
    const draft = await draftsCollection.doc(id).get()
    if (!draft.data) {
      throw new Error('草稿不存在')
    }

    // 删除草稿
    await draftsCollection.doc(id).remove()

    return {
      success: true
    }
  } catch (error) {
    console.error('删除草稿失败:', error)
    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
} 