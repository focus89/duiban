// 全局API对象
const workApi = {
  // 草稿相关
  addDraft: async function(work) {
    const result = await wx.cloud.callFunction({
      name: 'addDraft',
      data: { work }
    });
    return result.result;
  },

  updateDraft: async function(work) {
    const result = await wx.cloud.callFunction({
      name: 'updateDraft',
      data: { work }
    });
    return result.result;
  },

  getDrafts: async function() {
    const result = await wx.cloud.callFunction({
      name: 'getDrafts'
    });
    return result.result;
  },

  getDraft: async function(id) {
    const result = await wx.cloud.callFunction({
      name: 'getDraft',
      data: { id }
    });
    return result.result;
  },

  deleteDraft: async function(id) {
    const result = await wx.cloud.callFunction({
      name: 'deleteDraft',
      data: { id }
    });
    return result.result;
  },

  // 作品相关
  publishWork: async function(work) {
    const result = await wx.cloud.callFunction({
      name: 'publishWork',
      data: { work }
    });
    return result.result;
  },

  getWorks: async function(filter = {}) {
    const result = await wx.cloud.callFunction({
      name: 'getWorks',
      data: { filter }
    });
    return result.result;
  },

  getWork: async function(id) {
    const result = await wx.cloud.callFunction({
      name: 'getWork',
      data: { id }
    });
    return result.result;
  },

  deleteWork: async function(id) {
    const result = await wx.cloud.callFunction({
      name: 'deleteWork',
      data: { id }
    });
    return result.result;
  },

  updateStats: async function(id, type) {
    const result = await wx.cloud.callFunction({
      name: 'updateStats',
      data: { id, type }
    });
    return result.result;
  }
};

module.exports = {
  workApi
}; 