import { workService } from '../../services/work';

Page({
  data: {
    // ... existing code ...
    draftCount: 0
  },

  async onShow() {
    // ... existing code ...
    await this.updateDraftCount();
  },

  // 更新草稿数量
  async updateDraftCount() {
    try {
      const drafts = await workService.getDrafts();
      this.setData({
        draftCount: drafts.length
      });
    } catch (error) {
      console.error('获取草稿数量失败:', error);
    }
  },

  // 打开草稿箱
  onDrafts() {
    wx.navigateTo({
      url: '/pages/drafts/drafts'
    });
  },

  // ... existing code ...
}); 