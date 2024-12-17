const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { workId, updates } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 验证页面数量
    if (updates.pages && updates.pages.length > 4) {
      throw new Error('作品页面数量不能超过4个')
    }

    // 验证作品所有权
    const work = await db.collection('works')
      .aggregate()
      .match({
        _id: workId
      })
      .lookup({
        from: 'users',
        localField: 'author.id',
        foreignField: '_id',
        as: 'authorInfo'
      })
      .end()

    if (!work.list.length) {
      throw new Error('Work not found')
    }

    const currentWork = work.list[0]
    const author = currentWork.authorInfo[0]

    if (author.openId !== wxContext.OPENID) {
      throw new Error('No permission to update this work')
    }

    // 更新作品
    const updateData = {
      ...updates,
      updateTime: Date.now()
    }

    // 删除不允许更新的字段
    delete updateData.id
    delete updateData._id
    delete updateData.author
    delete updateData.createTime
    delete updateData.stats

    await db.collection('works').doc(workId).update({
      data: updateData
    })

    // 获取更新后的作品
    const updatedWork = await db.collection('works')
      .doc(workId)
      .get()

    return {
      ...updatedWork.data,
      id: updatedWork.data._id
    }
  } catch (err) {
    console.error('更新作品失败：', err)
    throw err
  }
} 