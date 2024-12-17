const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const draftsCollection = db.collection('drafts')

exports.main = async (event, context) => {
  const { id } = event
  const wxContext = cloud.getWXContext()

  console.log('开始获取草稿，ID:', id)
  console.log('当前用户 OPENID:', wxContext.OPENID)

  try {
    // 查询草稿
    const result = await draftsCollection.doc(id).get()

    console.log('查询结果:', result.data)

    if (!result.data) {
      return {
        success: false,
        error: '草稿不存在'
      }
    }

    // 验证所有权
    if (result.data.userId !== wxContext.OPENID) {
      return {
        success: false,
        error: '无权限访问此草稿'
      }
    }

    const draft = result.data

    // 确保草稿数据结构完整
    if (!draft.pages) {
      draft.pages = [{
        id: Date.now().toString(),
        elements: [],
        backgroundColor: '#ffffff'
      }]
    }

    // 确保每个页面都有正确的数据结构
    draft.pages = draft.pages.map(page => ({
      id: page.id || Date.now().toString(),
      elements: page.elements || [],
      backgroundColor: page.backgroundColor || '#ffffff'
    }))

    // 确保基本字段存在
    const processedDraft = {
      id: draft._id,
      title: draft.title || '未命名作品',
      pages: draft.pages,
      createTime: draft.createTime || Date.now(),
      updateTime: draft.updateTime || Date.now(),
      isDraft: true
    }

    console.log('返回的草稿数据:', processedDraft)

    return {
      success: true,
      draft: processedDraft
    }
  } catch (error) {
    console.error('获取草稿失败:', error)
    return {
      success: false,
      error: error.message || '获取草稿失败'
    }
  }
} 