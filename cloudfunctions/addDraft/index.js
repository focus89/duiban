const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const draftsCollection = db.collection('drafts')

exports.main = async (event, context) => {
  const { work } = event
  const wxContext = cloud.getWXContext()

  try {
    // 添加用户ID和时间戳
    work.userId = wxContext.OPENID
    work.createTime = Date.now()
    work.updateTime = Date.now()
    work.isDraft = true

    // 插入草稿
    const result = await draftsCollection.add({
      data: work
    })

    return {
      success: true,
      id: result._id
    }
  } catch (error) {
    console.error('添加草稿失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 