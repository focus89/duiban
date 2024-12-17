const { workService } = require('../../services/work.js');
const { userService } = require('../../services/user.js');

Page({
  data: {
    userInfo: null,
    activeTab: 'works',
    works: [],
    drafts: [],
    isLoading: false,
    openId: null,
    menuButtonBottom: 0
  },

  async onLoad() {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    this.setData({ menuButtonBottom: menuButton.bottom });

    try {
      await this.initOpenId();
      
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      if (userInfo) {
        await this.setData({ userInfo });
        await this.loadData();
      }
    } catch (error) {
      console.error('初始化失败:', error);
      wx.showToast({
        title: error.message || '初始化失败',
        icon: 'error'
      });
    }
  },

  async initOpenId() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      if (!result || !result.openid) {
        throw new Error('获取用户ID失败');
      }

      await this.setData({ openId: result.openid });
      return result.openid;
    } catch (error) {
      console.error('获取OpenID失败:', error);
      throw error;
    }
  },

  onShow() {
    // 显示底部菜单栏
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 2,
          show: true
        });
      }
    }

    // 检查是否需要切换标签页
    const app = getApp();
    if (app.globalData && app.globalData.profileActiveTab) {
      const targetTab = app.globalData.profileActiveTab;
      // 如果目标标签页与当前标签页不同，切换到目标标签页
      if (targetTab !== this.data.activeTab) {
        this.setData({ 
          activeTab: targetTab,
          isLoading: true
        }, () => {
          this.loadData().finally(() => {
            this.setData({ isLoading: false });
          });
        });
      }
      // 清除全局状态，避免影响下次进入
      delete app.globalData.profileActiveTab;
    }

    // 如果已经登录，刷新数据
    if (this.data.userInfo && this.data.openId) {
      this.setData({ isLoading: true }, () => {
        this.loadData().finally(() => {
          this.setData({ isLoading: false });
        });
      });
    }
  },

  // 处理微信登录
  async handleWechatLogin(e) {
    try {
      // 获取用户选择
      const avatarUrl = e.detail.avatarUrl;

      // 获取用户昵称
      const { nickName } = await new Promise((resolve, reject) => {
        wx.showModal({
          title: '请输入昵称',
          editable: true,
          placeholderText: '请输入昵称',
          success: (res) => {
            if (res.confirm) {
              resolve({ nickName: res.content || '用户' + Math.floor(Math.random() * 10000) });
            } else {
              reject(new Error('用户取消'));
            }
          },
          fail: reject
        });
      });

      // 准备用户信息
      const userInfo = {
        nickName,
        avatarUrl
      };

      // 创建或更新用户信息
      await userService.createOrUpdateUser(userInfo);

      // 更新全局用户信息
      const app = getApp();
      app.globalData.userInfo = userInfo;

      // 更新页面状态
      this.setData({ userInfo });

      // 初始化用户���据
      await this.initUserData();

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message === '用户取消' ? '已取消' : '登录失败',
        icon: 'none'
      });
    }
  },

  // 处理退出登录
  handleLogout() {
    wx.showActionSheet({
      itemList: ['退出登录'],
      itemColor: '#ff4444',
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            confirmColor: '#ff4444',
            success: (res) => {
              if (res.confirm) {
                // 清除用户信息
                const app = getApp();
                app.globalData.userInfo = null;
                
                // 清除页面状态
                this.setData({
                  userInfo: null,
                  openId: null,
                  works: [],
                  drafts: []
                });

                wx.showToast({
                  title: '已退出登录',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  },

  // 初始化用户数���
  async initUserData() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    try {
      // 获取用户OpenID
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      if (!result || !result.openid) {
        throw new Error('获取用户ID失败');
      }

      console.log('获取到的OpenID:', result.openid);
      
      // 设置 openId 并立即加载数据
      await this.setData({ openId: result.openid });
      await this.loadData();

    } catch (error) {
      console.error('初始化失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载数据
  async loadData() {
    if (!this.data.openId) {
      console.error('openId not available');
      return;
    }

    if (!this.data.userInfo) {
      console.error('userInfo not available');
      return;
    }

    this.setData({ isLoading: true });

    try {
      if (this.data.activeTab === 'works') {
        await this.loadWorks();
      } else {
        await this.loadDrafts();
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载作品列表
  async loadWorks() {
    if (!this.data.openId) {
      console.error('openId not available');
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      return;
    }

    try {
      console.log('开始加载作品列表, openId:', this.data.openId);
      const works = await workService.getWorks({
        userId: this.data.openId  // 使用 openId 作为 userId
      });
      console.log('获取到的作品列表:', works);

      if (!works || works.length === 0) {
        console.log('没有找到作品');
        this.setData({ works: [] });
        return;
      }
      
      // 处理作品，获取第一页缩略图
      const processedWorks = works.map(work => ({
        ...work,
        coverImage: work.coverImage || this.getFirstPageThumbnail(work),
        publishTime: this.formatTime(work.createTime || work.updateTime)
      }));
      
      console.log('处理后的作品列表:', processedWorks);
      this.setData({ works: processedWorks });
    } catch (error) {
      console.error('加载作品列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 获取作品第一页缩略图
  getFirstPageThumbnail(work) {
    console.log('获取缩略图，完整作品数据:', JSON.stringify(work));

    // 检查work对象
    if (!work) {
      console.log('work对象为空，返回默认图片');
      return '/images/empty-state.svg';
    }

    // 检查pages数组
    if (!work.pages || !Array.isArray(work.pages) || work.pages.length === 0) {
      console.log('pages数组无效，返回默认图片');
      return '/images/empty-state.svg';
    }

    const firstPage = work.pages[0];
    console.log('第一页完整数据:', JSON.stringify(firstPage));

    // 检查elements数组
    if (!firstPage.elements || !Array.isArray(firstPage.elements)) {
      console.log('elements数组无效，返回默认图片');
      return '/images/empty-state.svg';
    }

    // 打印所有元素以进行调试
    console.log('所有元素:', JSON.stringify(firstPage.elements));

    // 查找第一个图片元素
    const imageElements = firstPage.elements.filter(element => {
      const isValid = element && 
                     typeof element === 'object' && 
                     element.type === 'image' && 
                     element.url;
      console.log('检查元素:', element, '是否为有效图片:', isValid);
      return isValid;
    });

    console.log('找到的所有图片元素:', imageElements);

    if (imageElements.length > 0) {
      const firstImage = imageElements[0];
      console.log('使用第一个图片元素:', firstImage);
      return firstImage.url;
    }

    // 如果没有找到图片元素，尝试使用作品的封面图
    if (work.coverImage) {
      console.log('使用作品封面图:', work.coverImage);
      return work.coverImage;
    }

    // 如果都没有，返回默认图片
    console.log('没有找到任何可用的图片，返回默认图片');
    return '/images/empty-state.svg';
  },

  // 加载草稿列表
  async loadDrafts() {
    try {
      console.log('开始加载草稿列表');
      const result = await workService.getDrafts();
      
      if (!result || !result.success) {
        throw new Error(result?.error || '获取草稿列表失败');
      }

      const drafts = result.drafts || [];
      console.log('获取的原始草稿列表:', JSON.stringify(drafts));
      
      // 处理草稿数据，获取第一页缩略图
      const processedDrafts = drafts.map(draft => {
        console.log('处理草稿:', JSON.stringify(draft));
        
        // 确保 work 数据存在且结构正确
        const work = draft.work || {
          title: '未命名作品',
          pages: [{
            id: Date.now().toString(),
            elements: [],
            backgroundColor: '#ffffff'
          }]
        };

        // 确保 pages 数组存在
        if (!work.pages) {
          work.pages = [{
            id: Date.now().toString(),
            elements: [],
            backgroundColor: '#ffffff'
          }];
        }

        // 确保第一页的 elements 数组存在
        if (work.pages[0] && !work.pages[0].elements) {
          work.pages[0].elements = [];
        }

        const thumbnail = this.getFirstPageThumbnail(work);
        console.log('生成的缩略图URL:', thumbnail);

        return {
          ...draft,
          _id: draft.id, // 确保 _id 字段存在
          title: work.title || '未命名作品',
          coverImage: thumbnail,
          pageCount: work.pages ? work.pages.length : 1,
          updateTime: this.formatTime(draft.updateTime)
        };
      });
      
      console.log('处理后的草稿列表:', JSON.stringify(processedDrafts));
      this.setData({
        drafts: processedDrafts
      });
    } catch (error) {
      console.error('加载草稿列表失败:', error);
      throw error;
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.activeTab) {
      this.setData({ 
        activeTab: tab,
        isLoading: true
      }, () => {
        this.loadData();
      });
    }
  },

  // 点击作品
  onWorkTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/work/work?id=${id}`
    });
  },

  // 点击草稿
  async onDraftTap(e) {
    const draftId = e.currentTarget.dataset.id;
    
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      // 先获取草稿数据
      const result = await workService.getDraft(draftId);
      console.log('获取到草稿数据:', result);
      
      if (!result || !result.success || !result.draft) {
        throw new Error('草稿数据无效');
      }

      // 存储草稿数据到全局
      const app = getApp();
      if (!app.globalData) {
        app.globalData = {};
      }
      app.globalData.pendingWork = result.draft;
      app.globalData.pendingDraftId = draftId;

      wx.hideLoading();
      
      // 跳转到创作页面
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
        title: error.message || '加载失败',
        icon: 'error'
      });
    }
  },

  // 删除作品
  async onDeleteWork(e) {
    const workId = e.currentTarget.dataset.id;
    const work = this.data.works.find(w => w.id === workId || w._id === workId);
    
    if (!work) {
      wx.showToast({
        title: '作品不存在',
        icon: 'error'
      });
      return;
    }

    try {
      // 显示确认对话框
      const { confirm } = await wx.showModal({
        title: '确认删除',
        content: `确定要删除作品"${work.title || '未命名作品'}"吗？此操作不可恢复。`,
        confirmText: '删除',
        confirmColor: '#ff4444',
        cancelText: '取消'
      });

      if (!confirm) {
        return;
      }

      // 显示加载提示
      wx.showLoading({
        title: '正在删除...',
        mask: true
      });

      // 调用删除接口
      await workService.deleteWork(work.id || work._id);

      // 更新列表
      this.setData({
        works: this.data.works.filter(w => (w.id || w._id) !== workId)
      });

      // 示成功提示
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除作品失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 删除草稿
  async onDeleteDraft(e) {
    const draftId = e.currentTarget.dataset.id;
    console.log('准备删除草稿，ID:', draftId);

    if (!draftId) {
      console.error('草稿ID无效:', draftId);
      wx.showToast({
        title: '草稿ID无效',
        icon: 'error'
      });
      return;
    }

    const draft = this.data.drafts.find(d => d._id === draftId);
    console.log('找到的草稿:', draft);
    
    if (!draft) {
      console.error('草稿不存在:', draftId);
      wx.showToast({
        title: '草稿不存在',
        icon: 'error'
      });
      return;
    }

    try {
      // 显示确认对话框
      const { confirm } = await wx.showModal({
        title: '确认删除',
        content: `确定要删除草稿"${draft.title || '未命名草稿'}"吗？此操作不可恢复。`,
        confirmText: '删除',
        confirmColor: '#ff4444',
        cancelText: '取消'
      });

      if (!confirm) {
        return;
      }

      // 显示加载提示
      wx.showLoading({
        title: '正在删除...',
        mask: true
      });

      // 调用删除接口
      await workService.deleteDraft(String(draftId));

      // 更新列表
      this.setData({
        drafts: this.data.drafts.filter(d => d._id !== draftId)
      });

      // 显示成功提示
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除草稿失败:', error);
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化时间绝对时间
  formatTime(timestamp) {
    if (!timestamp) return '未知时间';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
}); 