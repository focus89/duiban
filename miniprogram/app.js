const { userService } = require('./services/user');

App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    pendingDraftId: null,
    pendingWork: null,
    tabBarVisible: false
  },

  onLaunch: async function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'duiban-0gzskn859c8dc2c8',
        traceUser: true
      });
    }

    // 检查登录状态
    try {
      const userInfo = await userService.checkLoginState();
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }

    // 获取系统信息
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }

    // 默认隐藏导航栏
    this.globalData.tabBarVisible = false;

    console.log('App launched');
  },

  onShow: function() {
    console.log('App shown');
  },

  onHide: function() {
    // 清理pending状态
    this.globalData.pendingDraftId = null;
    this.globalData.pendingWork = null;
    console.log('App hidden');
  },

  onError: function(err) {
    console.error('App error:', err);
  }
}); 