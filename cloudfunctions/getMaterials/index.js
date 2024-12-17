const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { keyword, category, page = 1, pageSize = 20 } = event;
  const skip = (page - 1) * pageSize;

  try {
    // 构建查询条件
    const query = {};
    
    if (keyword) {
      query.$or = [
        { name: db.RegExp({ regexp: keyword, options: 'i' }) },
        { tags: keyword }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    // 查询总数
    const countResult = await db.collection('materials')
      .where(query)
      .count();
    
    // 查询数据
    const { data } = await db.collection('materials')
      .where(query)
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get();

    return {
      success: true,
      items: data,
      total: countResult.total
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}; 