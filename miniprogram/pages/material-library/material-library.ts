interface IMaterial {
  id: string;
  url: string;
  name: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  category: string;
  tags: string[];
  createTime: number;
}

interface IPageData {
  isReady: boolean;
  searchKeyword: string;
  currentCategory: string;
  categories: string[];
  materials: IMaterial[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

Page<IPageData>({
  data: {
    isReady: false,
    searchKeyword: '',
    currentCategory: '',
    categories: ['插画', '照片', '背景', '图标', '装饰'],
    materials: [],
    isLoading: false,
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    // 等待小程序环境准备就绪
    if (typeof wx.onAppShow === 'function') {
      this.setData({ isReady: true });
      this.loadMaterials();
    } else {
      wx.onReady(() => {
        this.setData({ isReady: true });
        this.loadMaterials();
      });
    }
  },

  // 搜索输入
  onSearchInput(e: WechatMiniprogram.Input) {
    if (!this.data.isReady) return;
    
    this.setData({
      searchKeyword: e.detail.value,
      page: 1,
      materials: [],
      hasMore: true
    }, () => {
      this.loadMaterials();
    });
  },

  // 分类切换
  onCategoryTap(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isReady) return;
    
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      page: 1,
      materials: [],
      hasMore: true
    }, () => {
      this.loadMaterials();
    });
  },

  // 素材点击
  onMaterialTap(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isReady) return;
    
    const material = e.currentTarget.dataset.material;
    const eventChannel = this.getOpenerEventChannel();
    
    try {
      eventChannel.emit('selectMaterial', material);
      wx.navigateBack();
    } catch (error) {
      this.showToast('选择素材失败', 'error');
    }
  },

  // 加载更多
  onLoadMore() {
    if (!this.data.isReady || this.data.isLoading || !this.data.hasMore) return;
    this.loadMaterials();
  },

  // 加载素材
  async loadMaterials() {
    if (this.data.isLoading) return;
    
    try {
      this.setData({ isLoading: true });
      
      // 构建查询条件
      const query: any = {
        page: this.data.page,
        pageSize: this.data.pageSize
      };
      
      if (this.data.searchKeyword) {
        query.keyword = this.data.searchKeyword;
      }
      
      if (this.data.currentCategory) {
        query.category = this.data.currentCategory;
      }
      
      // 调用云函数获取素材列表
      const { result } = await wx.cloud.callFunction({
        name: 'getMaterials',
        data: query
      });
      
      // 更新数据
      this.setData({
        materials: this.data.page === 1 ? result.items : [...this.data.materials, ...result.items],
        hasMore: result.items.length === this.data.pageSize,
        page: this.data.page + 1,
        isLoading: false
      });
    } catch (error) {
      this.setData({ isLoading: false });
      this.showToast('加载失败', 'error');
    }
  },

  // 安全的Toast显示方法
  showToast(title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none') {
    if (!this.data.isReady) return;
    
    wx.showToast({
      title,
      icon
    });
  }
}); 