const { workService } = require('../../services/work.js');
const app = getApp();

Page({
  data: {
    drafts: []
  },

  onShow() {
    this.loadDrafts();
  },

  // 加载草稿列表
  async loadDrafts() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    try {
      const drafts = await workService.getDrafts();
      this.setData({
        drafts: drafts.map(draft => ({
          ...draft,
          updateTime: this.formatTime(draft.updateTime),
          pageCount: draft.work.pages.length
        }))
      });
      wx.hideLoading();
    } catch (error) {
      console.error('加载草稿失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 打开草稿
  async onDraftTap(e) {
    const draftId = e.currentTarget.dataset.id;
    
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      // 先获取草稿数据
      const result = await workService.getDraft(draftId);
      console.log('获取到的草稿数据:', result);
      
      if (!result || !result.success || !result.draft || !result.draft.work) {
        throw new Error('草稿数据无效');
      }

      // 存储草稿数据到全局
      if (!app.globalData) {
        app.globalData = {};
      }
      app.globalData.pendingWork = result.draft.work;
      app.globalData.pendingDraftId = draftId;

      wx.hideLoading();
      
      // 使用navigateTo跳转到创作页面，添加draftId参数
      wx.navigateTo({
        url: `/pages/create/create?from=drafts&draftId=${draftId}`,
        fail: (err) => {
          console.error('跳转创作页面失败:', err);
          wx.showToast({
            title: '打开失败',
            icon: 'error'
          });
        }
      });
    } catch (error) {
      console.error('加载草稿失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 删除草稿
  async onDeleteDraft(e) {
    const draftId = e.currentTarget.dataset.id;
    const draft = this.data.drafts.find(d => d.id === draftId);
    
    if (!draft) return;

    try {
      const res = await wx.showModal({
        title: '删除确认',
        content: `确定要删除"${draft.work.title || '未命名作品'}"吗？`,
        confirmText: '删除',
        confirmColor: '#ff4444'
      });

      if (res.confirm) {
        wx.showLoading({
          title: '删除中...',
          mask: true
        });

        await workService.deleteDraft(draftId);
        await this.loadDrafts();

        wx.hideLoading();
        wx.showToast({
          title: '已删除',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('删除草稿失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    // 小时内
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }
    
    // 24小时内
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    // 超过24小时
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}); 