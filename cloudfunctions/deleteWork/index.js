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
    // 确保只能删除自己的作品
    const { data: work } = await worksCollection.doc(id).get()
    
    if (!work) {
      return {
        success: false,
        error: '作品不存在'
      }
    }

    if (work.userId !== wxContext.OPENID) {
      return {
        success: false,
        error: '无权限删除此作品'
      }
    }

    // 删除作品
    await worksCollection.doc(id).remove()

    return {
      success: true
    }
  } catch (error) {
    console.error('删除作品失败:', error)
    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
} 