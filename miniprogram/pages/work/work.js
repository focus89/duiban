const { workService } = require('../../services/work');

// 缓存窗口大小（预加载的作品数量）
const CACHE_WINDOW_SIZE = 2;

// 触摸相关常量
const TOUCH_THRESHOLD = 10; // 触摸移动阈值
const TAP_DURATION = 200; // 点击持续时间阈值

Page({
  data: {
    work: null,
    workList: [],
    currentWorkIndex: 0,
    isLoading: true,
    isEditMode: false,
    currentPageIndex: 0,
    userInfo: null,
    isLiked: false,
    isCollected: false,
    showControls: false,
    currentTab: 'browse',
    isEmpty: false,
    nextWork: null,
    currentTranslateY: 0,
    currentTranslateX: 0,
    isTransitioning: false,
    windowHeight: 0,
    windowWidth: 0,
    isDragging: false,
    dragDirection: null,
    lastTapTime: 0,
    touchStartTime: 0,
    touchMoved: false,
    debug: {
      touchInfo: null,
      lastAction: null
    },
    minSwipeDistance: 50
  },

  // 作品缓存
  workCache: new Map(),

  onLoad: async function(options) {
    // 获取屏幕尺寸
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      windowHeight: systemInfo.windowHeight,
      windowWidth: systemInfo.windowWidth,
      minSwipeDistance: systemInfo.windowHeight * 0.15  // 设置滑动阈值为屏幕高度的15%
    });

    const { workId, refresh } = options;
    
    // 获取用户信息
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    this.setData({ userInfo });

    try {
      // 如果需要刷新或没有指定作品ID，先加载作品列表
      if (refresh || !workId) {
        await this.loadWorkList();
      }

      // 如果指定了作品ID，获取该作品并确保它在列表第一位
      if (workId) {
        try {
          const work = await workService.getWork(workId);
          if (work) {
            const works = this.data.works || [];
            // 移除列表中已存在的相同作品
            const filteredWorks = works.filter(w => w._id !== workId);
            // 将新作品放在第一位
            this.setData({
              works: [work, ...filteredWorks]
            });
          }
        } catch (error) {
          console.error('Failed to load specific work:', error);
          // 如果获取指定作品失败，但已经加载了作品列表，就继续显示列表
          if (!this.data.works) {
            await this.loadWorkList();
          }
        }
      }

      // 设置导航栏状态
      if (typeof this.getTabBar === 'function') {
        const tabBar = this.getTabBar();
        if (tabBar) {
          tabBar.setData({
            selected: 0,
            show: false  // 默认隐藏导航栏
          });
        }
      }
    } catch (error) {
      console.error('Failed to load works:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  onShow() {
    // 确保浏览按钮处于选中状态
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 0
        });
      }
    }
  },

  // 监听触摸开始
  onTouchStart(e) {
    if (this.data.isTransitioning) return;
    
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    
    this.setData({
      isDragging: false,
      dragDirection: null,
      touchMoved: false
    });
  },

  // 监听触摸移动
  onTouchMove(e) {
    if (this.data.isTransitioning) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // 如果还没有确定方向
    if (!this.data.dragDirection) {
      // 判断是否超���阈值
      if (Math.abs(deltaX) > TOUCH_THRESHOLD || Math.abs(deltaY) > TOUCH_THRESHOLD) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        this.setData({
          isDragging: true,
          dragDirection: direction,
          touchMoved: true
        });

        // 如果是垂直滑动，隐藏导航栏和控件
        if (direction === 'vertical') {
          this.setData({
            showControls: false
          });
          if (typeof this.getTabBar === 'function') {
            const tabBar = this.getTabBar();
            if (tabBar) {
              tabBar.setData({
                show: false,
                selected: 0
              });
              // 更新全局状态
              const app = getApp();
              app.globalData.tabBarVisible = false;
            }
          }
        }
      }
    }
    
    // 如果正在拖动，更新位置
    if (this.data.isDragging) {
      if (this.data.dragDirection === 'vertical') {
        // 添加边界阻尼效果
        const { currentWorkIndex, workList, windowHeight } = this.data;
        const maxWorks = workList.length;
        const maxDeltaY = windowHeight * 0.3; // 允许超出30%的高度
        let limitedDeltaY = deltaY;

        // 处理边界情况
        if (currentWorkIndex === 0 && deltaY > 0) {
          limitedDeltaY = Math.min(deltaY * 0.3, maxDeltaY); // 第一个作品向下滑动时增加阻尼
        } else if (currentWorkIndex === maxWorks - 1 && deltaY < 0) {
          limitedDeltaY = Math.max(deltaY * 0.3, -maxDeltaY); // 最后一个作品向上滑动时增加阻尼
        }

        this.setData({
          currentTranslateY: limitedDeltaY
        });
      } else if (this.data.dragDirection === 'horizontal') {
        // 限制水平滑动范围
        const { currentPageIndex, work } = this.data;
        const maxPages = work.pages.length;
        const windowWidth = this.data.windowWidth;
        
        // 计算最大可滑动距离
        const maxDeltaX = windowWidth * 0.3; // 允许超出30%的宽度
        let limitedDeltaX = deltaX;
        
        // 处理边界情况
        if (currentPageIndex === 0 && deltaX > 0) {
          limitedDeltaX = Math.min(deltaX * 0.3, maxDeltaX); // 第一页向右滑动时增加阻尼
        } else if (currentPageIndex === maxPages - 1 && deltaX < 0) {
          limitedDeltaX = Math.max(deltaX * 0.3, -maxDeltaX); // 最后一页向左滑动时增加阻尼
        }
        
        this.setData({
          currentTranslateX: limitedDeltaX
        });
      }
    }
  },

  // 监听触摸结束
  onTouchEnd(e) {
    if (this.data.isTransitioning) return;
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;

    // 如果是短按且没有移动，则视为点击
    if (touchDuration < TAP_DURATION && !this.data.touchMoved) {
      // 检查点击是否在控制区域内
      const target = e.target;
      const isControlArea = target.dataset.area === 'control';
      
      // 如果不是控制区域的点击，则切换控件显示状态
      if (!isControlArea) {
        const newShowControls = !this.data.showControls;
        this.setData({
          showControls: newShowControls
        });

        // 获取自定义tabBar实例并更新其显示状态
        if (typeof this.getTabBar === 'function') {
          const tabBar = this.getTabBar();
          if (tabBar) {
            if (newShowControls) {
              tabBar.setData({
                show: true,
                selected: 0  // 确保浏览按钮处于选中状态
              });
              // 更新全局状态
              const app = getApp();
              app.globalData.tabBarVisible = true;
            } else {
              tabBar.setData({
                show: false,
                selected: 0  // 保持浏览按钮的选中状态
              });
              // 更新全局状态
              const app = getApp();
              app.globalData.tabBarVisible = false;
            }
          }
        }
      }
      return;
    }

    // 处理滑动
    if (this.data.isDragging) {
      const { dragDirection, currentTranslateY, currentTranslateX, work } = this.data;
      
      if (dragDirection === 'vertical') {
        if (currentTranslateY > this.data.minSwipeDistance) {
          this.onPrevWork();
        } else if (currentTranslateY < -this.data.minSwipeDistance) {
          this.onNextWork();
        } else {
          this.setData({
            isTransitioning: true,
            currentTranslateY: 0,
            isDragging: false
          });
          
          setTimeout(() => {
            this.setData({
              isTransitioning: false
            });
          }, 300);
        }
      } else if (dragDirection === 'horizontal') {
        const { currentPageIndex } = this.data;
        const maxPages = work.pages.length;
        const windowWidth = this.data.windowWidth;
        const velocity = Math.abs(currentTranslateX) / touchDuration;
        const threshold = windowWidth * 0.15; // 15% 的屏幕宽度作为切换阈值
        
        let newPageIndex = currentPageIndex;
        
        // 根据滑动距离和速度判断是否切换页面
        if (Math.abs(currentTranslateX) > threshold || velocity > 0.3) {
          if (currentTranslateX > 0 && currentPageIndex > 0) {
            newPageIndex = currentPageIndex - 1;
          } else if (currentTranslateX < 0 && currentPageIndex < maxPages - 1) {
            newPageIndex = currentPageIndex + 1;
          }
        }
        
        // 开始切换动画
        this.setData({
          isTransitioning: true,
          currentTranslateX: 0,
          currentPageIndex: newPageIndex,
          isDragging: false
        });
        
        // 动画结束后重置状态
        setTimeout(() => {
          this.setData({
            isTransitioning: false
          });
        }, 300);
      }
    }

    // 重置触摸状态
    this.setData({
      touchMoved: false,
      dragDirection: null
    });
  },

  // 预加载指定范围的作品
  async preloadWorks(startIndex, endIndex) {
    const { workList } = this.data;
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < workList.length && !this.workCache.has(workList[i]._id)) {
        try {
          const work = await workService.getWork(workList[i]._id);
          if (work) {
            this.workCache.set(workList[i]._id, work);
          }
        } catch (error) {
          console.warn('预加载作品失败:', error);
        }
      }
    }
  },

  // 更新缓存窗口
  async updateCacheWindow(currentIndex) {
    const startIndex = Math.max(0, currentIndex - CACHE_WINDOW_SIZE);
    const endIndex = Math.min(this.data.workList.length - 1, currentIndex + CACHE_WINDOW_SIZE);
    await this.preloadWorks(startIndex, endIndex);

    // 清理超出缓存窗口的作品
    const minKeepIndex = Math.max(0, currentIndex - CACHE_WINDOW_SIZE * 2);
    const maxKeepIndex = Math.min(this.data.workList.length - 1, currentIndex + CACHE_WINDOW_SIZE * 2);
    for (const [id] of this.workCache) {
      const workIndex = this.data.workList.findIndex(w => w._id === id);
      if (workIndex < minKeepIndex || workIndex > maxKeepIndex) {
        this.workCache.delete(id);
      }
    }
  },

  // 加载作品列表
  async loadWorkList() {
    try {
      const filter = {
        orderBy: 'updateTime desc',
        page: 1,
        pageSize: 50
      };

      const workList = await workService.getWorks(filter);
      
      if (!workList || workList.length === 0) {
        this.setData({
          isLoading: false,
          isEmpty: true
        });
        return;
      }

      // 确保每个作品都有有效的ID
      const validWorkList = workList.filter(work => work && (work._id || work.id));
      
      // 标准化ID字段
      const normalizedWorkList = validWorkList.map(work => ({
        ...work,
        _id: work._id || work.id
      }));

      // 设置第一个作品为当前作品
      const firstWork = normalizedWorkList[0];

      this.setData({
        workList: normalizedWorkList,
        work: firstWork,
        isLoading: false,
        isEmpty: normalizedWorkList.length === 0
      });

      // 加载第一个作品并预加载后续作品
      if (normalizedWorkList.length > 0) {
        const firstWorkId = normalizedWorkList[0]._id;
        if (firstWorkId) {
          await this.loadWork(firstWorkId);
          await this.updateCacheWindow(0);
        }
      }
    } catch (error) {
      console.error('加载作品列表失败:', error);
      this.setData({
        isLoading: false,
        isEmpty: true
      });
    }
  },

  // 切换到下一个作品
  async onNextWork() {
    const { currentWorkIndex, workList, windowHeight } = this.data;
    if (currentWorkIndex < workList.length - 1) {
      const nextIndex = currentWorkIndex + 1;
      const nextWork = workList[nextIndex];
      
      if (!nextWork || !nextWork._id) {
        console.error('无效的作品数据:', nextWork);
        return;
      }

      // ���始滑动动画
      this.setData({
        isTransitioning: true,
        currentTranslateY: -windowHeight,
        isDragging: false,
        showControls: false
      });

      try {
        // 从缓存加载或请求新作品
        let nextWorkData = this.workCache.get(nextWork._id);
        if (!nextWorkData) {
          nextWorkData = await workService.getWork(nextWork._id);
          if (nextWorkData) {
            this.workCache.set(nextWork._id, nextWorkData);
          }
        }

        if (!nextWorkData) {
          throw new Error('作品加载失败');
        }

        // 更新显示
        setTimeout(() => {
          this.setData({
            work: nextWorkData,
            currentWorkIndex: nextIndex,
            currentPageIndex: 0,
            currentTranslateY: 0,
            isTransitioning: false
          });

          // 更新缓存窗口
          this.updateCacheWindow(nextIndex);
        }, 300);
      } catch (error) {
        console.error('加载下一个作品失败:', error);
        this.setData({ 
          isTransitioning: false,
          currentTranslateY: 0,
          isDragging: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } else {
      // 已经是最后一个作品，弹回原位
      this.setData({
        isTransitioning: true,
        currentTranslateY: 0,
        isDragging: false
      });
      
      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, 300);
    }
  },

  // 切换到上一个作品
  async onPrevWork() {
    const { currentWorkIndex, workList, windowHeight } = this.data;
    if (currentWorkIndex > 0) {
      const prevIndex = currentWorkIndex - 1;
      const prevWork = workList[prevIndex];
      
      if (!prevWork || !prevWork._id) {
        console.error('无效的作品数据:', prevWork);
        return;
      }

      // 开始滑动动画
      this.setData({
        isTransitioning: true,
        currentTranslateY: windowHeight,
        isDragging: false,
        showControls: false
      });

      try {
        // 从缓存加载或请求新作品
        let prevWorkData = this.workCache.get(prevWork._id);
        if (!prevWorkData) {
          prevWorkData = await workService.getWork(prevWork._id);
          if (prevWorkData) {
            this.workCache.set(prevWork._id, prevWorkData);
          }
        }

        if (!prevWorkData) {
          throw new Error('作品加载失败');
        }

        // 更新显示
        setTimeout(() => {
          this.setData({
            work: prevWorkData,
            currentWorkIndex: prevIndex,
            currentPageIndex: 0,
            currentTranslateY: 0,
            isTransitioning: false
          });

          // 更新缓存窗口
          this.updateCacheWindow(prevIndex);
        }, 300);
      } catch (error) {
        console.error('加载上一个作品失败:', error);
        this.setData({ 
          isTransitioning: false,
          currentTranslateY: 0,
          isDragging: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } else {
      // 已经是第一个作品，弹回原位
      this.setData({
        isTransitioning: true,
        currentTranslateY: 0,
        isDragging: false
      });
      
      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, 300);
    }
  },

  // 加载作品
  async loadWork(id) {
    if (!id) return;
    
    try {
      // 先从缓存中查找
      let work = this.workCache.get(id);
      if (!work) {
        work = await workService.getWork(id);
        this.workCache.set(id, work);
      }
      
      if (!work) {
        throw new Error('作品不存在');
      }

      // 确保必要的数据字段存在
      work.pages = work.pages || [];
      work.stats = work.stats || { views: 0, likes: 0, comments: 0, collects: 0 };
      work.author = work.author || {};
      
      this.setData({
        work,
        isLoading: false,
        currentPageIndex: 0
      });

      // 更新浏览次数（忽略错误）
      try {
        await workService.updateStats(id, 'view');
      } catch (error) {
        console.warn('更新浏览次数失败，忽略此错误:', error);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      this.setData({ isLoading: false });
    }
  },

  // 阻止事件冒泡
  stopPropagation(e) {
    e.stopPropagation();
  },

  // 点赞作品
  async onLike() {
    if (!this.data.work || !this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const work = this.data.work;
      const newStats = {
        ...work.stats,
        likes: work.stats.likes + (this.data.isLiked ? -1 : 1)
      };

      await workService.updateStats(work.id, 'like');
      
      this.setData({
        'work.stats': newStats,
        isLiked: !this.data.isLiked
      });

      wx.showToast({
        title: this.data.isLiked ? '已点赞' : '取消',
        icon: 'success'
      });
    } catch (error) {
      console.error('点赞失败:', error);
      wx.showToast({
        title: error.message || '���作失败',
        icon: 'error'
      });
    }
  },

  // 收藏作品
  async onCollect() {
    if (!this.data.work || !this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const work = this.data.work;
      const newStats = {
        ...work.stats,
        collects: (work.stats.collects || 0) + (this.data.isCollected ? -1 : 1)
      };

      await workService.updateStats(work.id, 'collect');
      
      this.setData({
        'work.stats': newStats,
        isCollected: !this.data.isCollected
      });

      wx.showToast({
        title: this.data.isCollected ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    } catch (error) {
      console.error('收藏失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'error'
      });
    }
  },

  // 分享作品
  onShareAppMessage() {
    const work = this.data.work;
    if (!work) return {};

    return {
      title: work.title || '未命名作品',
      path: `/pages/work/work?id=${work.id}`,
      imageUrl: work.coverImage || work.pages[0]?.elements.find(e => e.type === 'image')?.url
    };
  },

  // 切换到下一页
  onNextPage() {
    const { currentPageIndex, work } = this.data;
    const maxPages = work.pages.length;
    
    if (currentPageIndex < maxPages - 1) {
      this.setData({
        isTransitioning: true,
        currentPageIndex: currentPageIndex + 1,
        currentTranslateX: 0
      });

      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, 300);
    }
  },

  // 切换到上一页
  onPrevPage() {
    const { currentPageIndex } = this.data;
    
    if (currentPageIndex > 0) {
      this.setData({
        isTransitioning: true,
        currentPageIndex: currentPageIndex - 1,
        currentTranslateX: 0
      });

      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, 300);
    }
  }
}); 