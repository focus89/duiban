const { workService } = require('../../services/work.js');

Page({
  data: {
    work: null,
    isLoading: true,
    isPreviewMode: false,
    currentPageIndex: 0,
    userInfo: null,
    isDirty: false,
    showMenu: false,
    showSettings: false,
    showSettingsDialog: false,
    isMoving: false,
    moveStartX: 0,
    moveStartY: 0,
    elementStartX: 0,
    elementStartY: 0,
    isResizing: false,
    resizePosition: null,
    resizeStartX: 0,
    resizeStartY: 0,
    elementStartWidth: 0,
    elementStartHeight: 0,
    elementStartRotation: 0,
    isRotating: false,
    rotateStartAngle: 0,
    rotatingElementId: null,
    isShiftPressed: false,
    selectedElementId: null,
    isReady: true,
    showAdjustPanel: false,
    adjustingElement: null,
    showLayerPanel: false,
    layerElements: [],
    isPinching: false,
    pinchStartDistance: 0,
    pinchStartScale: 1,
    pinchCenterX: 0,
    pinchCenterY: 0
  },

  onLoad(options) {
    try {
      if (options.draftId) {
        // 从全局数据获取草稿
        const app = getApp();
        if (app.globalData && app.globalData.pendingWork) {
          const work = {
            ...app.globalData.pendingWork,
            isDraft: true,
            updateTime: Date.now()
          };

          this.setData({
            work: work,
            currentPageIndex: 0,
            selectedElementId: null,
            isLoading: false
          });

          // 清除全局数据
          delete app.globalData.pendingWork;
          delete app.globalData.pendingDraftId;
        } else {
          // 如果全局数据不存在，则直接从服务器加载
          workService.getDraft(options.draftId).then(result => {
            if (result && result.success && result.draft) {
              const work = {
                ...result.draft,
                isDraft: true,
                updateTime: Date.now()
              };

              this.setData({
                work: work,
                currentPageIndex: 0,
                selectedElementId: null,
                isLoading: false
              });
            } else {
              throw new Error('草稿不存在');
            }
          });
        }
      } else if (options.workId) {
        // 加载已有作品
        this.loadWork(options.workId);
      } else {
        // 创建新作品
        this.initNewWork();
      }
    } catch (error) {
      console.error('加载失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      });
      wx.navigateBack();
    }
  },

  onShow() {
    console.log('创作页面显示');
    // 强制隐藏底部导航栏
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.hide();
        tabBar.setData({ 
          show: false
        });
      }
    }
  },

  // 初始化新作品
  initNewWork() {
    const work = {
      title: '未命名作品',
      pages: [{
        backgroundColor: '#ffffff',
        elements: []
      }],
      isDraft: true,
      author: {
        id: this.data.userInfo?.id,
        name: this.data.userInfo?.nickName,
        avatarUrl: this.data.userInfo?.avatarUrl
      },
      createTime: Date.now(),
      updateTime: Date.now()
    };

    this.setData({
      work,
      isLoading: false,
      currentPageIndex: 0,
      selectedElementId: null,
      isDirty: false
    });
  },

  // 加载作品
  async loadWork(id) {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const work = await workService.getWork(id);
      
      if (!work) {
        throw new Error('作品不存在');
      }

      this.setData({
        work,
        isLoading: false
      });

      wx.hideLoading();
    } catch (error) {
      console.error('加载作品失败:', error);
      wx.hideLoading();
      throw error;
    }
  },

  // 退出编辑
  onExitEdit() {
    // 检查是否有任何元素
    const hasElements = this.data.work.pages.some(page => page.elements && page.elements.length > 0);
    
    if (!hasElements) {
      // 如果没有任何元素，直接返回"我的"页面的草稿箱
      const app = getApp();
      app.globalData.profileActiveTab = 'drafts';
      wx.switchTab({
        url: '/pages/profile/profile'
      });
      return;
    }

    wx.showModal({
      title: '保存草稿',
      content: '是否将当前作品保存为草稿？',
      confirmText: '保存',
      cancelText: '不保存',
      showCancel: true,
      success: async (res) => {
        if (res.confirm) {
          try {
            await this.saveDraft();
            wx.showToast({
              title: '已保存草稿',
              icon: 'success'
            });
          } catch (error) {
            console.error('保存草稿失败:', error);
            wx.showToast({
              title: '保存失败',
              icon: 'error'
            });
            return;
          }
        }
        
        // 无论是否保存，都返回"我的"页面的草稿箱
        const app = getApp();
        app.globalData.profileActiveTab = 'drafts';
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }
    });
  },

  // 切换标签页
  onTabTap(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== this.data.currentPageIndex) {
      this.setData({
        currentPageIndex: index,
        selectedElementId: null
      });
    }
  },

  // 关闭标签页
  onTabClose(e) {
    const index = e.currentTarget.dataset.index;
    const pages = this.data.work.pages;
    if (pages.length <= 1) {
      wx.showToast({
        title: '至少保留一页',
        icon: 'none'
      });
      return;
    }

    pages.splice(index, 1);
    const newIndex = Math.min(this.data.currentPageIndex, pages.length - 1);

    this.setData({
      'work.pages': pages,
      currentPageIndex: newIndex,
      isDirty: true
    });
  },

  // 添加新页面
  onAddPage() {
    const pages = this.data.work.pages || [];
    if (pages.length >= 4) {
      wx.showToast({
        title: '最多只能添加4页',
        icon: 'none'
      });
      return;
    }

    pages.push({
      backgroundColor: '#ffffff',
      elements: []
    });

    this.setData({
      'work.pages': pages,
      currentPageIndex: pages.length - 1,
      selectedElementId: null,  // 确保不选中任何元素
      isDirty: true
    });
  },

  // 打开设置面板
  onSettingsTap() {
    this.setData({
      showSettingsDialog: true
    });
  },

  // 进入预览模式
  enterPreviewMode() {
    this.setData({ isPreviewMode: true });
    
    // 隐藏导航栏
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.hide();
      }
    }
  },

  // 退出预览模式
  onExitPreview() {
    this.togglePreviewMode();
  },

  // 切换预览模式
  togglePreviewMode() {
    const isPreviewMode = !this.data.isPreviewMode;
    this.setData({
      isPreviewMode,
      selectedElementId: null  // 取消选中状态
    });

    // 通知自定义 tabBar 更新显示状态
    if (typeof this.getTabBar === 'function') {
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 1,  // 设置"创作"标签为选中状态
          show: !isPreviewMode
        });
      }
    }
  },

  // 发布作品
  async publishWork() {
    try {
      wx.showLoading({
        title: '发布中...',
        mask: true
      });

      // 发布作品
      const result = await wx.cloud.callFunction({
        name: 'publishWork',
        data: {
          work: this.data.work
        }
      });

      // 先隐藏 loading
      wx.hideLoading();

      if (result && result.result && result.result.success) {
        // 设置全局状态，指示返回到作品列表
        const app = getApp();
        app.globalData.profileActiveTab = 'works';
        
        // 清理编辑状态
        this.setData({
          work: null,
          currentPageIndex: 0,
          isPreviewMode: false,
          isDirty: false,
          selectedElementId: null
        });

        // 显示成功提示
        await new Promise(resolve => {
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 1500,
            mask: true,
            success: resolve
          });
        });

        // 等待 toast 显示一会儿
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 使用 reLaunch 确保清理所有页面栈后跳转
        wx.reLaunch({
          url: '/pages/profile/profile',
          fail: (err) => {
            console.error('跳转失败:', err);
            // 如果 reLaunch 失败，尝试使用 switchTab
            wx.switchTab({
              url: '/pages/profile/profile'
            });
          }
        });
      } else {
        throw new Error(result.result?.message || '发布失败');
      }
    } catch (error) {
      console.error('Failed to publish work:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'error'
      });
    }
  },

  // 工具栏点击
  onToolTap(e) {
    const tool = e.currentTarget.dataset.tool;
    console.log('工具点击:', tool);
    
    switch (tool) {
      case 'text':
        this.addTextElement();
        break;
      case 'shape':
        this.addShapeElement();
        break;
      case 'import':
        this.importImage();
        break;
      case 'adjust':
        this.showAdjustPanel();
        break;
      case 'fullscreen':
        this.makeElementFullscreen();
        break;
      case 'copy':
        this.onCopyElement();
        break;
      case 'delete':
        this.onDeleteElement();
        break;
      case 'layer':
        this.showLayerPanel();
        break;
    }
  },

  // 返回主菜单
  onBackToMainMenu() {
    this.setData({
      selectedElementId: null
    });
  },

  // 画布点击
  onCanvasClick(e) {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    
    // 如果点击空白处取消选中
    if (!e.target.dataset.id) {
      this.setData({
        selectedElementId: null
      });
    }
  },

  // 元素点击
  onElementTap(e) {
    const elementId = e.currentTarget.dataset.id;
    if (elementId) {
      this.setData({
        selectedElementId: elementId
      });
    }
  },

  // 删除元素
  onDeleteElement() {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const elementIndex = currentPage.elements.findIndex(e => e.id === this.data.selectedElementId);
    
    if (elementIndex !== -1) {
      currentPage.elements.splice(elementIndex, 1);
      this.setData({
        'work.pages': pages,
        selectedElementId: null,
        isDirty: true
      });
    }
  },

  // 复制元素
  onCopyElement() {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(e => e.id === this.data.selectedElementId);
    
    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20
      };
      currentPage.elements.push(newElement);
      this.setData({
        'work.pages': pages,
        selectedElementId: newElement.id,
        isDirty: true
      });
    }
  },

  // 控制点触摸开始
  onControlPointTouchStart(e) {
    const position = e.currentTarget.dataset.position;
    const touch = e.touches[0];
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (element) {
      // 将屏幕坐标转换为rpx
      const systemInfo = wx.getSystemInfoSync();
      const scale = 750 / systemInfo.windowWidth;

      if (position === 'rotate') {
        // 旋转模式
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        this.setData({
          isRotating: true,
          rotateStartAngle: Math.atan2(touch.clientY - centerY, touch.clientX - centerX),
          elementStartRotation: element.rotation || 0,
          'rotatingElementId': element.id
        });
      } else {
        // 缩放模式
        this.setData({
          isResizing: true,
          resizePosition: position,
          resizeStartX: touch.clientX * scale,
          resizeStartY: touch.clientY * scale,
          elementStartWidth: element.width,
          elementStartHeight: element.height,
          elementStartX: element.x,
          elementStartY: element.y,
          elementStartRotation: element.rotation || 0
        });
      }
    }
  },

  // 控制点触摸移动
  onControlPointTouchMove(e) {
    const touch = e.touches[0];
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (!element) return;

    if (this.data.isRotating) {
      // 旋转处理
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
      let deltaAngle = (currentAngle - this.data.rotateStartAngle) * (180 / Math.PI);
      
      // 计算新的旋转角度，并将其限制在0-360度范围内
      let newRotation = (this.data.elementStartRotation + deltaAngle) % 360;
      if (newRotation < 0) newRotation += 360;

      // 如果按住Shift键（通过其他方式检测），则将角度吸附到15度的倍数
      if (this.data.isShiftPressed) {
        newRotation = Math.round(newRotation / 15) * 15;
      }

      element.rotation = newRotation;
      
      this.setData({
        'work.pages': pages
      });
    } else if (this.data.isResizing) {
      const systemInfo = wx.getSystemInfoSync();
      const scale = 750 / systemInfo.windowWidth;
      
      const currentX = touch.clientX * scale;
      const currentY = touch.clientY * scale;
      const deltaX = currentX - this.data.resizeStartX;
      const deltaY = currentY - this.data.resizeStartY;

      // 计算旋转角度的正弦和余弦值
      const rotation = (this.data.elementStartRotation || 0) * Math.PI / 180;
      const cos = Math.cos(-rotation);
      const sin = Math.sin(-rotation);

      // 将移动距离转换到旋转后的坐标系
      const rotatedDeltaX = deltaX * cos - deltaY * sin;
      const rotatedDeltaY = deltaX * sin + deltaY * cos;

      let newWidth = this.data.elementStartWidth;
      let newHeight = this.data.elementStartHeight;
      let newX = this.data.elementStartX;
      let newY = this.data.elementStartY;

      // 根据控制点位置计算新的尺寸和位置
      switch (this.data.resizePosition) {
        case 'top-left':
          newWidth = Math.max(40, this.data.elementStartWidth - rotatedDeltaX);
          newHeight = Math.max(40, this.data.elementStartHeight - rotatedDeltaY);
          newX = this.data.elementStartX + (this.data.elementStartWidth - newWidth) * cos;
          newY = this.data.elementStartY + (this.data.elementStartHeight - newHeight) * sin;
          break;
        case 'top-right':
          newWidth = Math.max(40, this.data.elementStartWidth + rotatedDeltaX);
          newHeight = Math.max(40, this.data.elementStartHeight - rotatedDeltaY);
          newY = this.data.elementStartY + (this.data.elementStartHeight - newHeight) * sin;
          break;
        case 'bottom-left':
          newWidth = Math.max(40, this.data.elementStartWidth - rotatedDeltaX);
          newHeight = Math.max(40, this.data.elementStartHeight + rotatedDeltaY);
          newX = this.data.elementStartX + (this.data.elementStartWidth - newWidth) * cos;
          break;
        case 'bottom-right':
          newWidth = Math.max(40, this.data.elementStartWidth + rotatedDeltaX);
          newHeight = Math.max(40, this.data.elementStartHeight + rotatedDeltaY);
          break;
      }

      // 更新元素尺寸和位置
      element.width = newWidth;
      element.height = newHeight;
      element.x = newX;
      element.y = newY;

      this.setData({
        'work.pages': pages
      });
    }
  },

  // 控制点触摸结束
  onControlPointTouchEnd() {
    if (this.data.isRotating || this.data.isResizing) {
      this.setData({
        isRotating: false,
        isResizing: false,
        resizePosition: null,
        rotatingElementId: null,
        isDirty: true
      });
    }
  },

  // 画布触摸开始
  onCanvasTouchStart(e) {
    if (!this.data.selectedElementId || this.data.isPreviewMode) return;

    const touches = e.touches;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (!element) return;

    // 将屏幕坐标转换为rpx
    const systemInfo = wx.getSystemInfoSync();
    const scale = 750 / systemInfo.windowWidth;

    if (touches.length === 2) {
      // 双指触摸 - 缩放模式
      const touch1 = touches[0];
      const touch2 = touches[1];

      // 计算两指之间的距离
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // 计算两指中心点
      const centerX = (touch1.clientX + touch2.clientX) / 2 * scale;
      const centerY = (touch1.clientY + touch2.clientY) / 2 * scale;

      this.setData({
        isPinching: true,
        pinchStartDistance: distance,
        pinchStartScale: 1,
        pinchCenterX: centerX,
        pinchCenterY: centerY,
        elementStartWidth: element.width,
        elementStartHeight: element.height,
        elementStartX: element.x,
        elementStartY: element.y
      });
    } else if (touches.length === 1) {
      // 单指触摸 - 移动模式
      const touch = touches[0];
      
      this.setData({
        isMoving: true,
        moveStartX: touch.clientX * scale,
        moveStartY: touch.clientY * scale,
        elementStartX: element.x,
        elementStartY: element.y
      });
    }
  },

  // 画布触摸移动
  onCanvasTouchMove(e) {
    if (!this.data.selectedElementId || this.data.isPreviewMode) return;

    const touches = e.touches;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (!element) return;

    const systemInfo = wx.getSystemInfoSync();
    const scale = 750 / systemInfo.windowWidth;

    if (this.data.isPinching && touches.length === 2) {
      // 处理双指缩放
      const touch1 = touches[0];
      const touch2 = touches[1];

      // 计算当前两指之间的距离
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // 计算缩放比例
      const scaleRatio = currentDistance / this.data.pinchStartDistance;

      // 计算新的尺寸，确保不小于最小尺寸
      const newWidth = Math.max(40, this.data.elementStartWidth * scaleRatio);
      const newHeight = Math.max(40, this.data.elementStartHeight * scaleRatio);

      // 计算新的位置，保持元素中心点不变
      const widthDiff = newWidth - this.data.elementStartWidth;
      const heightDiff = newHeight - this.data.elementStartHeight;
      const newX = this.data.elementStartX - widthDiff / 2;
      const newY = this.data.elementStartY - heightDiff / 2;

      // 更新元素属性
      element.width = newWidth;
      element.height = newHeight;
      element.x = newX;
      element.y = newY;

      this.setData({
        'work.pages': pages,
        isDirty: true
      });
    } else if (this.data.isMoving && touches.length === 1) {
      // 处理单指移动
      const touch = touches[0];
      const deltaX = (touch.clientX * scale) - this.data.moveStartX;
      const deltaY = (touch.clientY * scale) - this.data.moveStartY;

      element.x = this.data.elementStartX + deltaX;
      element.y = this.data.elementStartY + deltaY;

      this.setData({
        'work.pages': pages,
        isDirty: true
      });
    }
  },

  // 画布触摸结束
  onCanvasTouchEnd() {
    if (this.data.isMoving || this.data.isPinching) {
      this.setData({
        isMoving: false,
        isPinching: false
      });
    }
  },

  // 添加文本元素
  addTextElement() {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const newElement = {
      id: Date.now().toString(),
      type: 'text',
      content: '点击编辑文本',
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      fontSize: 28,
      color: '#000000',
      alignment: 'left',
      zIndex: (currentPage.elements || []).length
    };

    if (!currentPage.elements) {
      currentPage.elements = [];
    }
    currentPage.elements.push(newElement);

    this.setData({
      'work.pages': pages,
      selectedElementId: newElement.id,
      isDirty: true
    });
  },

  // 添加形状元素
  addShapeElement() {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const newElement = {
      id: Date.now().toString(),
      type: 'shape',
      shapeType: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: '#000000',
      borderWidth: 0,
      borderColor: '#000000',
      zIndex: (currentPage.elements || []).length
    };

    if (!currentPage.elements) {
      currentPage.elements = [];
    }
    currentPage.elements.push(newElement);

    this.setData({
      'work.pages': pages,
      selectedElementId: newElement.id,
      isDirty: true
    });
  },

  // 导入图片
  importImage() {
    wx.chooseImage({
      count: 1,
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        try {
          wx.showLoading({
            title: '上传中...'
          });

          // 获取图片信息
          const imageInfo = await new Promise((resolve, reject) => {
            wx.getImageInfo({
              src: tempFilePath,
              success: resolve,
              fail: reject
            });
          });

          // 获取系统信息
          const systemInfo = wx.getSystemInfoSync();
          const scale = 750 / systemInfo.windowWidth;

          // 上传图片到云存��
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `images/${Date.now()}.${tempFilePath.split('.').pop()}`,
            filePath: tempFilePath
          });

          const pages = this.data.work.pages;
          const currentPage = pages[this.data.currentPageIndex];

          // 计算合适的显示尺寸，保持原始宽高比
          const maxWidth = 600; // 最大宽度（rpx）
          const maxHeight = 800; // 最大高度（rpx）
          let width = imageInfo.width * scale;
          let height = imageInfo.height * scale;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
          }

          // 计算居中位置（假设画布宽度为750rpx，高度为1000rpx）
          const canvasWidth = 750;
          const canvasHeight = 1000;
          const x = (canvasWidth - width) / 2;
          const y = (canvasHeight - height) / 2;

          const newElement = {
            id: Date.now().toString(),
            type: 'image',
            url: uploadResult.fileID,
            x: x,
            y: y,
            width: width,
            height: height,
            rotation: 0,
            zIndex: (currentPage.elements || []).length
          };

          if (!currentPage.elements) {
            currentPage.elements = [];
          }
          currentPage.elements.push(newElement);

          this.setData({
            'work.pages': pages,
            selectedElementId: newElement.id,
            isDirty: true
          });

          wx.hideLoading();
        } catch (error) {
          console.error('上传图片失败:', error);
          wx.hideLoading();
          wx.showToast({
            title: '上传失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 使元素全屏
  makeElementFullscreen() {
    if (!this.data.selectedElementId) return;

    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (element) {
      element.x = 0;
      element.y = 0;
      element.width = 750;  // 画布宽度
      element.height = 1000; // 画布高度
      element.rotation = 0;  // 重置旋转

      this.setData({
        'work.pages': pages,
        isDirty: true
      });
    }
  },

  // 显示调整面板
  showAdjustPanel() {
    if (!this.data.selectedElementId) return;

    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (element) {
      this.setData({
        showAdjustPanel: true,
        adjustingElement: element
      });
    }
  },

  // 关闭调整面板
  onCloseAdjustPanel() {
    this.setData({
      showAdjustPanel: false,
      adjustingElement: null
    });
  },

  // 更新元素属性
  onUpdateElementProperty(e) {
    const { property, value } = e.detail;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === this.data.selectedElementId);

    if (element) {
      // 根据不同的属性类型进行更新
      switch (property) {
        case 'fontSize':
          element.fontSize = parseInt(value);
          break;
        case 'color':
          element.color = value;
          break;
        case 'backgroundColor':
          element.backgroundColor = value;
          break;
        case 'borderWidth':
          element.borderWidth = parseInt(value);
          break;
        case 'borderColor':
          element.borderColor = value;
          break;
        case 'borderRadius':
          element.borderRadius = parseInt(value);
          break;
        case 'opacity':
          element.opacity = parseFloat(value);
          break;
        case 'alignment':
          element.alignment = value;
          break;
        case 'fontWeight':
          element.fontWeight = value;
          break;
        case 'fontStyle':
          element.fontStyle = value;
          break;
        case 'textDecoration':
          element.textDecoration = value;
          break;
      }

      this.setData({
        'work.pages': pages,
        adjustingElement: element,
        isDirty: true
      });
    }
  },

  // 更新图层顺序
  onUpdateElementZIndex(e) {
    const { direction } = e.detail;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const elementIndex = currentPage.elements.findIndex(el => el.id === this.data.selectedElementId);

    if (elementIndex !== -1) {
      const element = currentPage.elements[elementIndex];
      let newIndex;

      if (direction === 'up' && elementIndex < currentPage.elements.length - 1) {
        // 上移一层
        newIndex = elementIndex + 1;
      } else if (direction === 'down' && elementIndex > 0) {
        // 下移一层
        newIndex = elementIndex - 1;
      } else if (direction === 'top') {
        // 移到最顶层
        newIndex = currentPage.elements.length - 1;
      } else if (direction === 'bottom') {
        // 移到最底层
        newIndex = 0;
      }

      if (newIndex !== undefined && newIndex !== elementIndex) {
        // 移除当前位置的元素
        currentPage.elements.splice(elementIndex, 1);
        // 插入到新位置
        currentPage.elements.splice(newIndex, 0, element);

        // 更新所有元素的 zIndex
        currentPage.elements.forEach((el, index) => {
          el.zIndex = index;
        });

        this.setData({
          'work.pages': pages,
          isDirty: true
        });
      }
    }
  },

  // 显示图层面板
  showLayerPanel() {
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    
    // 确保元素数组存在
    if (!currentPage.elements) {
      currentPage.elements = [];
    }

    // 按 zIndex 排序元素
    const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

    this.setData({
      showLayerPanel: true,
      layerElements: sortedElements
    });
  },

  // 关闭图层面板
  onCloseLayerPanel() {
    this.setData({
      showLayerPanel: false
    });
  },

  // 切换图层可见性
  onToggleLayerVisibility(e) {
    const elementId = e.currentTarget.dataset.id;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === elementId);

    if (element) {
      element.isHidden = !element.isHidden;
      
      // 更新图层列表
      const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

      this.setData({
        'work.pages': pages,
        layerElements: sortedElements,
        isDirty: true
      });
    }
  },

  // 选择图层
  onSelectLayer(e) {
    const elementId = e.currentTarget.dataset.id;
    this.setData({
      selectedElementId: elementId
    });
  },

  // 锁定/解锁图层
  onToggleLayerLock(e) {
    const elementId = e.currentTarget.dataset.id;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === elementId);

    if (element) {
      element.isLocked = !element.isLocked;
      
      // 如果锁定了当前选中的元素，取消选中
      if (element.isLocked && elementId === this.data.selectedElementId) {
        this.setData({
          selectedElementId: null
        });
      }

      // 更新图层列表
      const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

      this.setData({
        'work.pages': pages,
        layerElements: sortedElements,
        isDirty: true
      });
    }
  },

  // 重命名图层
  onRenameLayer(e) {
    const { elementId, newName } = e.detail;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === elementId);

    if (element) {
      element.name = newName;
      
      // 更新图层列表
      const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

      this.setData({
        'work.pages': pages,
        layerElements: sortedElements,
        isDirty: true
      });
    }
  },

  // 复制图层
  onDuplicateLayer(e) {
    const elementId = e.currentTarget.dataset.id;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const element = currentPage.elements.find(el => el.id === elementId);

    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20,
        name: `${element.name || '图层'} 副本`,
        zIndex: Math.max(...currentPage.elements.map(el => el.zIndex)) + 1
      };

      currentPage.elements.push(newElement);
      
      // 更新图层列表
      const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

      this.setData({
        'work.pages': pages,
        layerElements: sortedElements,
        selectedElementId: newElement.id,
        isDirty: true
      });
    }
  },

  // 删除图层
  onDeleteLayer(e) {
    const elementId = e.currentTarget.dataset.id;
    const pages = this.data.work.pages;
    const currentPage = pages[this.data.currentPageIndex];
    const elementIndex = currentPage.elements.findIndex(el => el.id === elementId);

    if (elementIndex !== -1) {
      currentPage.elements.splice(elementIndex, 1);
      
      // 重新计算所有元素的 zIndex
      currentPage.elements.forEach((el, index) => {
        el.zIndex = index;
      });

      // 更新图层列表
      const sortedElements = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

      this.setData({
        'work.pages': pages,
        layerElements: sortedElements,
        selectedElementId: elementId === this.data.selectedElementId ? null : this.data.selectedElementId,
        isDirty: true
      });
    }
  },

  // 关闭设置对话框
  onCloseSettingsDialog() {
    this.setData({
      showSettingsDialog: false
    });
  },

  // 更新作品设置
  onUpdateSettings(e) {
    const { title, description, isPublic } = e.detail.value;
    const work = this.data.work;

    // 更新作品信息
    work.title = title || '未命名作品';
    work.description = description;
    work.isPublic = isPublic;

    this.setData({
      work,
      showSettingsDialog: false,
      isDirty: true
    });

    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  // 选择标签
  onTagSelect(e) {
    console.log('选择标签:', e.currentTarget.dataset.tag);
    const tag = e.currentTarget.dataset.tag;
    const work = this.data.work;

    if (!work.tags) {
      work.tags = [];
    }

    const index = work.tags.indexOf(tag);
    if (index === -1) {
      // 添加标签
      if (work.tags.length >= 3) {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none'
        });
        return;
      }
      work.tags.push(tag);
    } else {
      // 移除标签
      work.tags.splice(index, 1);
    }

    console.log('更新后的标签:', work.tags);
    // 只更新work.tags，而不是整个work对象
    this.setData({
      'work.tags': work.tags,
      isDirty: true
    });
  },

  // 保存草稿
  async saveDraft() {
    try {
      const { work } = this.data;
      if (!work) return;

      work.isDraft = true;
      work.updateTime = Date.now();
      
      await workService.saveDraft(work);
      
      this.setData({
        isDirty: false
      });
    } catch (error) {
      console.error('保存草稿失败:', error);
      wx.showToast({
        title: '保存草稿失败',
        icon: 'error'
      });
      throw error;
    }
  }
}); 