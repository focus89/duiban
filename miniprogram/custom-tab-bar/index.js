Component({
  data: {
    show: false,
    selected: 0,
    color: "#999999",
    selectedColor: "#333333",
    list: [{
      pagePath: "/pages/work/work",
      text: "浏览",
      iconPath: "/images/icons/browse.png",
      selectedIconPath: "/images/icons/browse-active.png"
    }, {
      pagePath: "/pages/create/create",
      text: "创作",
      iconPath: "/images/icons/create.png",
      selectedIconPath: "/images/icons/create-active.png",
      isSpecial: true
    }, {
      pagePath: "/pages/profile/profile",
      text: "我的",
      iconPath: "/images/icons/profile.png",
      selectedIconPath: "/images/icons/profile-active.png"
    }]
  },

  lifetimes: {
    attached() {
      // 获取全局导航栏状态
      const app = getApp();
      this.setData({ show: app.globalData.tabBarVisible });
    }
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const item = this.data.list[data.index];
      
      if (item.isSpecial) {
        // 创作按钮使用navigateTo
        wx.navigateTo({
          url: '/pages/create/create?mode=create',
          fail: (err) => {
            console.error('跳转创作页面失败:', err);
            wx.showToast({
              title: '打开失败',
              icon: 'error'
            });
          }
        });
      } else {
        // 其他按钮使用switchTab
        wx.switchTab({
          url: data.path,
          success: () => {
            this.setData({
              selected: data.index
            });
          }
        });
      }
    },

    show() {
      const app = getApp();
      app.globalData.tabBarVisible = true;
      this.setData({ show: true });
    },

    hide() {
      const app = getApp();
      app.globalData.tabBarVisible = false;
      this.setData({ 
        show: false,
        selected: -1  // Reset selected state when hidden
      });
    }
  }
}); 