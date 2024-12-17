const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { work } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 验证页面数量
    if (work.pages.length > 4) {
      throw new Error('作品页面数量不能超过4个')
    }

    // 获取用户信息
    const user = await db.collection('users')
      .where({
        openId: wxContext.OPENID
      })
      .get()

    if (!user.data.length) {
      throw new Error('User not found')
    }

    const now = Date.now()
    const newWork = {
      ...work,
      author: {
        id: user.data[0]._id,
        name: user.data[0].nickName,
        avatar: user.data[0].avatarUrl
      },
      createTime: now,
      updateTime: now,
      stats: {
        views: 0,
        likes: 0,
        shares: 0
      }
    }

    // 创建作品
    const result = await db.collection('works').add({
      data: newWork
    })

    return {
      ...newWork,
      id: result._id
    }
  } catch (err) {
    console.error('创建作品失败：', err)
    throw err
  }
} 