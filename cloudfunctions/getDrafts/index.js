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
  const wxContext = cloud.getWXContext()

  try {
    console.log('开始获取草稿列表，用户 OPENID:', wxContext.OPENID);
    
    // 获取用户的草稿列表，确保获取所有字段
    const result = await draftsCollection
      .where({
        userId: wxContext.OPENID
      })
      .field({
        _id: true,
        userId: true,
        work: true,
        pages: true,
        elements: true,
        title: true,
        createTime: true,
        updateTime: true
      })
      .orderBy('updateTime', 'desc')
      .get()

    console.log('数据库查询结果:', JSON.stringify(result.data, null, 2));

    if (!result.data || result.data.length === 0) {
      console.log('未找到草稿数据');
      return {
        success: true,
        drafts: []
      };
    }

    // 确保每个草稿都有完整的数据结构
    const drafts = result.data.map(draft => {
      console.log('处理草稿数据:', JSON.stringify(draft, null, 2));
      
      // 处理两种可能的数据结构
      let work;
      if (draft.work) {
        // 新的数据结构，work 是一个独立的对象
        work = draft.work;
      } else {
        // 旧的数据结构，work 的属性直接在根级别
        work = {
          title: draft.title || '未命名作品',
          pages: draft.pages || [{
            id: Date.now().toString(),
            elements: draft.elements || [],
            backgroundColor: '#ffffff'
          }]
        };
      }

      // 确保work对象有正确的结构
      if (!work.pages || !Array.isArray(work.pages)) {
        console.log('pages不是数组，重置为默认值');
        work.pages = [{
          id: Date.now().toString(),
          elements: [],
          backgroundColor: '#ffffff'
        }];
      }

      // 确保第一页存在且有正确的结构
      if (!work.pages[0] || typeof work.pages[0] !== 'object') {
        console.log('第一页数据无效，重置为默认值');
        work.pages[0] = {
          id: Date.now().toString(),
          elements: [],
          backgroundColor: '#ffffff'
        };
      }

      // 确保elements数组存在且为数组
      if (!Array.isArray(work.pages[0].elements)) {
        console.log('elements不是数组，重置为默认值');
        work.pages[0].elements = [];
      }

      const processedDraft = {
        id: draft._id,
        userId: draft.userId,
        work: work,
        createTime: draft.createTime || Date.now(),
        updateTime: draft.updateTime || Date.now()
      };

      console.log('处理后的草稿数据:', JSON.stringify(processedDraft, null, 2));
      return processedDraft;
    });

    console.log('返回处理后的草稿列表:', JSON.stringify(drafts, null, 2));

    return {
      success: true,
      drafts: drafts
    }
  } catch (error) {
    console.error('��取草稿列表失败:', error)
    return {
      success: false,
      error: error.message || '获取草稿列表失败'
    }
  }
} 