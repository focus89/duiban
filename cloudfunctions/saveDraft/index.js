// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { work } = event

  try {
    if (!work) {
      return {
        success: false,
        error: '无效的作品数据'
      }
    }

    // 确保作品属于当前用户
    work.userId = wxContext.OPENID
    work.updateTime = Date.now()
    work.isDraft = true

    let result
    // 如果作品已存在则更新，否则创建新作品
    if (work.id) {
      try {
        result = await db.collection('drafts').doc(work.id).get()
      } catch (error) {
        // 如果草稿不存在，创建新草稿
        if (error.errCode === -1) {
          const res = await db.collection('drafts').add({
            data: {
              userId: work.userId,
              work: work,
              updateTime: work.updateTime,
              isDraft: true,
              createTime: Date.now()
            }
          })
          return {
            success: true,
            draft: {
              id: res._id,
              userId: work.userId,
              work: work,
              updateTime: work.updateTime
            }
          }
        } else {
          throw error
        }
      }

      if (result.data && result.data.userId === wxContext.OPENID) {
        // 更新现有草稿
        await db.collection('drafts').doc(work.id).update({
          data: {
            work: work,
            updateTime: work.updateTime
          }
        })
        return {
          success: true,
          draft: {
            id: work.id,
            userId: work.userId,
            work: work,
            updateTime: work.updateTime
          }
        }
      }
    }

    // 创建新草稿
    const res = await db.collection('drafts').add({
      data: {
        userId: work.userId,
        work: work,
        updateTime: work.updateTime,
        isDraft: true,
        createTime: Date.now()
      }
    })

    return {
      success: true,
      draft: {
        id: res._id,
        userId: work.userId,
        work: work,
        updateTime: work.updateTime
      }
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    return {
      success: false,
      error: error.message || '保存草稿失败'
    }
  }
} 