const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const worksCollection = db.collection('works')
const _ = db.command

exports.main = async (event, context) => {
  const { id, type } = event
  const wxContext = cloud.getWXContext()

  console.log('更新统计信息:', { id, type })

  try {
    if (!id) {
      throw new Error('作品ID不能为空')
    }

    // 根据不同类型更新不同的统计字段
    let updateData = {}
    switch (type) {
      case 'view':
        updateData = {
          views: _.inc(1)
        }
        break
      case 'like':
        updateData = {
          likes: _.inc(1)
        }
        break
      case 'collect':
        updateData = {
          collects: _.inc(1)
        }
        break
      case 'comment':
        updateData = {
          comments: _.inc(1)
        }
        break
      default:
        throw new Error('无效的统计类型')
    }

    // 更新作品统计信息
    const result = await worksCollection.doc(id).update({
      data: {
        stats: updateData,
        updateTime: new Date()
      }
    })

    console.log('更新结果:', result)

    return {
      success: true,
      ...result
    }
  } catch (error) {
    console.error('更新统计信息失败:', error)
    return {
      success: false,
      error: error.message || '更新统计失败'
    }
  }
} 