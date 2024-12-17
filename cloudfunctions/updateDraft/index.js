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
    // 确保只能更新自己的草稿
    const draft = await draftsCollection.doc(work.id).get()
    if (draft.data.userId !== wxContext.OPENID) {
      throw new Error('无权限更新此草稿')
    }

    // 更新草稿
    work.updateTime = Date.now()
    const result = await draftsCollection.doc(work.id).update({
      data: {
        ...work,
        userId: wxContext.OPENID
      }
    })

    return {
      success: true,
      updated: result.stats.updated
    }
  } catch (error) {
    console.error('更新草稿失败:', error)
    return {
      success: false,
      error: error
    }
  }
} 