import { workStore } from '../../store/work'
import { Work, Element } from '../../types/work'
import { workService } from '../../services/work';
import { WorkDraft } from '../../types/work';

interface IPageData {
  work: Work;
  currentPageIndex: number;
  selectedElementId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  elementStartX: number;
  elementStartY: number;
  isRotating: boolean;
  rotateStartAngle: number;
  elementStartRotation: number;
  isReady: boolean;
  showBackgroundDialog: boolean;
  showSettingsDialog: boolean;
  backgroundColors: string[];
}

interface IHistory {
  work: Work;
  selectedElementId: string | null;
}

let history: IHistory[] = [];
let currentHistoryIndex = -1;

Page({
  data: {
    work: {
      id: '',
      title: '未命名作品',
      author: {
        id: '',
        name: '',
        avatar: ''
      },
      pages: [{
        id: '1',
        elements: [],
        backgroundColor: '#ffffff'
      }],
      createTime: Date.now(),
      updateTime: Date.now(),
      stats: {
        views: 0,
        likes: 0,
        shares: 0
      },
      tags: [],
      visibility: 'private'
    },
    currentPageIndex: 0,
    selectedElementId: null,
    canUndo: false,
    canRedo: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    elementStartX: 0,
    elementStartY: 0,
    isRotating: false,
    rotateStartAngle: 0,
    elementStartRotation: 0,
    isReady: false,
    showBackgroundDialog: false,
    showSettingsDialog: false,
    backgroundColors: ['#ffffff', '#f5f5f5', '#000000', '#ff4444', '#44ff44', '#4444ff']
  },

  async onLoad(options) {
    if (!this.data.isReady) return;

    try {
      if (options.draftId) {
        // 加载草稿
        const draft = await workService.getDraft(options.draftId);
        if (draft) {
          this.setData({
            work: draft.work,
            currentPageIndex: 0,
            selectedElementId: null
          });
          this.saveHistory();
        } else {
          wx.showToast({
            title: '草稿不存在',
            icon: 'error'
          });
          wx.navigateBack();
        }
      } else if (options.workId) {
        // 加载已有作品
        await this.loadWork(options.workId);
      } else {
        // 创建新作品
        this.initNewWork();
      }
    } catch (error) {
      console.error('加载失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      wx.navigateBack();
    }
  },

  // 初始化新作品
  initNewWork() {
    const work = {
      id: '',
      title: '未命名作品',
      pages: [{
        id: Date.now().toString(),
        elements: [],
        backgroundColor: '#ffffff'
      }],
      visibility: 'private'
    };

    this.setData({
      work,
      currentPageIndex: 0,
      selectedElementId: null
    });
    this.saveHistory();
  },

  // 页签相关方法
  switchPage(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== this.data.currentPageIndex) {
      this.setData({
        currentPageIndex: index,
        selectedElementId: null
      });
    }
  },

  addPage() {
    const pages = this.data.work.pages;
    if (pages.length >= 4) {
      wx.showToast({
        title: '最多只能创建4个页面',
        icon: 'none'
      });
      return;
    }

    const newPage = {
      id: Date.now().toString(),
      elements: [],
      backgroundColor: '#ffffff'
    };

    const newPages = [...pages, newPage];
    this.setData({
      'work.pages': newPages,
      currentPageIndex: newPages.length - 1,
      selectedElementId: null
    }, () => {
      this.saveHistory();
    });
  },

  closePage(e) {
    const index = e.currentTarget.dataset.index;
    const pages = this.data.work.pages;
    
    if (pages.length <= 1) {
      wx.showToast({
        title: '至少需要保留一个页面',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '关闭确认',
      content: '页面关闭无法恢复，是否确认？',
      confirmText: '确认',
      success: (res) => {
        if (res.confirm) {
          const newPages = [...pages];
          newPages.splice(index, 1);
          
          let newCurrentIndex = this.data.currentPageIndex;
          if (index === this.data.currentPageIndex) {
            newCurrentIndex = Math.max(0, index - 1);
          } else if (index < this.data.currentPageIndex) {
            newCurrentIndex = this.data.currentPageIndex - 1;
          }

          this.setData({
            'work.pages': newPages,
            currentPageIndex: newCurrentIndex,
            selectedElementId: null
          }, () => {
            this.saveHistory();
          });
        }
      }
    });
  },

  saveHistory() {
    const { work, selectedElementId } = this.data;
    history = history.slice(0, currentHistoryIndex + 1);
    history.push({
      work: JSON.parse(JSON.stringify(work)),
      selectedElementId
    });
    currentHistoryIndex = history.length - 1;
    
    this.setData({
      canUndo: currentHistoryIndex > 0,
      canRedo: false
    });
  },

  onUndo() {
    if (!this.data.canUndo) return;
    currentHistoryIndex--;
    const { work, selectedElementId } = history[currentHistoryIndex];
    
    this.setData({
      work: JSON.parse(JSON.stringify(work)),
      selectedElementId,
      canUndo: currentHistoryIndex > 0,
      canRedo: true
    });
  },

  onRedo() {
    if (!this.data.canRedo) return;
    currentHistoryIndex++;
    const { work, selectedElementId } = history[currentHistoryIndex];
    
    this.setData({
      work: JSON.parse(JSON.stringify(work)),
      selectedElementId,
      canUndo: true,
      canRedo: currentHistoryIndex < history.length - 1
    });
  },

  // 加载作品
  async loadWork(workId: string) {
    if (!this.data.isReady) return;
    
    try {
      const work = await workStore.getWorkById(workId);
      this.setData({ work });
      this.saveHistory();
    } catch (error) {
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
  },

  // 安全的Modal显示方法
  showModal(options: WechatMiniprogram.ShowModalOption): Promise<WechatMiniprogram.ShowModalSuccessCallbackResult> {
    if (!this.data.isReady) {
      return Promise.reject(new Error('Environment not ready'));
    }
    
    return new Promise((resolve, reject) => {
      wx.showModal({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  },

  // 安全的ActionSheet显示方法
  showActionSheet(options: WechatMiniprogram.ShowActionSheetOption): Promise<WechatMiniprogram.ShowActionSheetSuccessCallbackResult> {
    if (!this.data.isReady) {
      return Promise.reject(new Error('Environment not ready'));
    }
    
    return new Promise((resolve, reject) => {
      wx.showActionSheet({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  },

  // 导航事件
  async onBack() {
    if (!this.data.isReady) return;
    
    try {
      const res = await wx.showModal({
        title: '保存提示',
        content: '是否将当前作品保存为草稿？',
        confirmText: '保存',
        cancelText: '不保存',
        success: async (res) => {
          if (res.confirm) {
            await this.saveDraft();
            wx.showToast({
              title: '已保存草稿',
              icon: 'success'
            });
          }
          wx.navigateBack();
        }
      });
    } catch (error) {
      console.error('关闭失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 保存草稿
  async saveDraft() {
    try {
      const draft = await workService.saveDraft(this.data.work);
      this.setData({
        'work.isDraft': true,
        'work.draftId': draft.id,
        'work.lastEditTime': draft.updateTime
      });
      return draft;
    } catch (error) {
      console.error('保存草稿失败:', error);
      throw error;
    }
  },

  // 加载草稿
  async loadDraft(draftId: string) {
    try {
      const draft = await workService.getDraft(draftId);
      if (draft) {
        this.setData({
          work: draft.work,
          currentPageIndex: 0
        });
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 添加形状
  async addShape() {
    if (!this.data.isReady) return;
    
    try {
      const res = await this.showActionSheet({
        itemList: ['矩形', '圆形', '三角形']
      });
      
      const shapeTypes = ['rectangle', 'circle', 'triangle'];
      const shapeType = shapeTypes[res.tapIndex];
      
      const elements = this.data.work.pages[this.data.currentPageIndex].elements;
      const newElement: Element = {
        id: Date.now().toString(),
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: elements.length,
        shapeType,
        color: '#000000',
        borderWidth: 0,
        borderColor: '#000000'
      };
      
      this.addElement(newElement);
    } catch (error) {
      // 用户取消不需要处理
      if (error.errMsg && error.errMsg.includes('cancel')) return;
      this.showToast('操作失败', 'error');
    }
  },

  // 工具栏
  onToolTap(e) {
    const tool = e.currentTarget.dataset.tool;
    console.log('Tool tapped:', tool); // 添加日志
    
    switch (tool) {
      case 'text':
        this.addText();
        break;
      case 'shape':
        this.addShape();
        break;
      case 'import':
        this.importImage();
        break;
      case 'adjust':
        this.showAdjustPanel();
        break;
    }
  },

  // 添加文本
  addText() {
    const elements = this.data.work.pages[this.data.currentPageIndex].elements;
    const newElement: Element = {
      id: Date.now().toString(),
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 0,
      zIndex: elements.length,
      content: '点击编辑文本',
      fontSize: 28,
      fontFamily: 'sans-serif',
      color: '#000000',
      alignment: 'left'
    };
    
    this.addElement(newElement);
  },

  // 导入图片
  importImage() {
    console.log('Showing action sheet'); // 添加日志
    
    wx.showActionSheet({
      itemList: ['本地相册', '堆伴库', 'AI生成'],
      success: (res) => {
        console.log('Action sheet selected:', res.tapIndex); // 添加日志
        
        switch (res.tapIndex) {
          case 0:
            this.importFromAlbum();
            break;
          case 1:
            this.showMaterialLibrary();
            break;
          case 2:
            this.showAIImageGenerator();
            break;
        }
      },
      fail: (error) => {
        console.error('Action sheet failed:', error); // 添加日志
        if (!error.errMsg.includes('cancel')) {
          wx.showToast({
            title: '操作失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 从本地相册导入
  importFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          wx.showLoading({ title: '上传中...' });
          
          const tempFilePath = res.tempFilePaths[0];
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `works/${Date.now()}.${tempFilePath.split('.').pop()}`,
            filePath: tempFilePath
          });

          wx.hideLoading();

          const element = {
            id: Date.now().toString(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: this.data.work.pages[this.data.currentPageIndex].elements.length,
            url: uploadRes.fileID
          };

          const pages = [...this.data.work.pages];
          pages[this.data.currentPageIndex].elements.push(element);
          
          this.setData({
            'work.pages': pages,
            selectedElementId: element.id
          });
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: '导入失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 显示素材库
  showMaterialLibrary() {
    wx.navigateTo({
      url: '/pages/material-library/material-library',
      events: {
        selectMaterial: (material) => {
          const element = {
            id: Date.now().toString(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: this.data.work.pages[this.data.currentPageIndex].elements.length,
            url: material.url
          };

          const pages = [...this.data.work.pages];
          pages[this.data.currentPageIndex].elements.push(element);
          
          this.setData({
            'work.pages': pages,
            selectedElementId: element.id
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '打开素材库失败',
          icon: 'error'
        });
      }
    });
  },

  // 显示AI图片生成器
  showAIImageGenerator() {
    wx.navigateTo({
      url: '/pages/ai-image/ai-image',
      events: {
        generateImage: (image) => {
          const element = {
            id: Date.now().toString(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: this.data.work.pages[this.data.currentPageIndex].elements.length,
            url: image.url
          };

          const pages = [...this.data.work.pages];
          pages[this.data.currentPageIndex].elements.push(element);
          
          this.setData({
            'work.pages': pages,
            selectedElementId: element.id
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '打开AI生成器失败',
          icon: 'error'
        });
      }
    });
  },

  // 画布事件
  onCanvasTouchStart(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.selectedElementId) return;
    
    const touch = e.touches[0];
    const element = this.getSelectedElement();
    
    this.setData({
      isDragging: true,
      dragStartX: touch.pageX,
      dragStartY: touch.pageY,
      elementStartX: element.x,
      elementStartY: element.y
    });
  },

  onCanvasTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.pageX - this.data.dragStartX;
    const deltaY = touch.pageY - this.data.dragStartY;
    
    this.updateSelectedElement({
      x: this.data.elementStartX + deltaX,
      y: this.data.elementStartY + deltaY
    });
  },

  onCanvasTouchEnd() {
    if (this.data.isDragging) {
      this.setData({ isDragging: false });
      this.saveHistory();
    }
  },

  // 元素事件
  onElementTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedElementId: id });
  },

  onControlPointTap(e: WechatMiniprogram.TouchEvent) {
    const position = e.currentTarget.dataset.position;
    if (position === 'rotate') {
      const element = this.getSelectedElement();
      this.setData({
        isRotating: true,
        rotateStartAngle: this.getAngle(e),
        elementStartRotation: element.rotation || 0
      });
    }
  },

  // 辅助方法
  addElement(element: Element) {
    const { work, currentPageIndex } = this.data;
    const pages = [...work.pages];
    pages[currentPageIndex].elements.push(element);
    
    this.setData({
      'work.pages': pages,
      selectedElementId: element.id
    });
    
    this.saveHistory();
  },

  updateSelectedElement(updates: Partial<Element>) {
    if (!this.data.selectedElementId) return;
    
    const { work, currentPageIndex } = this.data;
    const pages = [...work.pages];
    const elements = [...pages[currentPageIndex].elements];
    const index = elements.findIndex(el => el.id === this.data.selectedElementId);
    
    if (index === -1) return;
    
    elements[index] = {
      ...elements[index],
      ...updates
    };
    
    pages[currentPageIndex].elements = elements;
    this.setData({
      'work.pages': pages
    });
  },

  getSelectedElement(): Element | null {
    if (!this.data.selectedElementId) return null;
    
    const { work, currentPageIndex } = this.data;
    return work.pages[currentPageIndex].elements.find(
      el => el.id === this.data.selectedElementId
    ) || null;
  },

  getAngle(e: WechatMiniprogram.TouchEvent): number {
    const touch = e.touches[0];
    const element = this.getSelectedElement();
    if (!element) return 0;
    
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    return Math.atan2(touch.pageY - centerY, touch.pageX - centerX) * 180 / Math.PI;
  },

  // 保存作品
  async saveWork() {
    try {
      wx.showLoading({
        title: '保存中...'
      });

      const { work } = this.data;
      work.updateTime = Date.now();

      if (work.id) {
        await workStore.updateWork(work.id, work);
      } else {
        const result = await workStore.createWork(work);
        this.setData({
          'work.id': result.id
        });
      }

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 显示调整面板
  showAdjustPanel() {
    if (!this.data.selectedElementId) {
      wx.showToast({
        title: '请先选择元素',
        icon: 'none'
      });
      return;
    }
    // TODO: 实现调整面板
  },

  // ���签点击
  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    if (index !== this.data.currentPageIndex) {
      this.setData({
        currentPageIndex: index,
        selectedElementId: null
      });
    }
  },

  // 关闭页签
  onTabClose(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '关闭确认',
      content: '页签关闭无法恢复，是否确认？',
      success: (res) => {
        if (res.confirm) {
          this.closePage(index);
        }
      }
    });
  },

  // 执行页面关闭
  closePage(index: number) {
    const pages = [...this.data.work.pages];
    pages.splice(index, 1);
    
    // 如果关闭的是当前页，切换到前一页
    let newCurrentIndex = this.data.currentPageIndex;
    if (index === this.data.currentPageIndex) {
      newCurrentIndex = Math.max(0, index - 1);
    } else if (index < this.data.currentPageIndex) {
      // 如果关闭的是当前页之前的页面，当前页索引需要减1
      newCurrentIndex = this.data.currentPageIndex - 1;
    }
    
    this.setData({
      'work.pages': pages,
      currentPageIndex: newCurrentIndex,
      selectedElementId: null
    });
  },

  // 添加新页面
  onAddPage() {
    if (this.data.work.pages.length >= 4) {
      wx.showToast({
        title: '最多只能创建4个页面',
        icon: 'none'
      });
      return;
    }

    const newPage = {
      id: Date.now().toString(),
      elements: [],
      backgroundColor: '#ffffff'
    };

    const pages = [...this.data.work.pages, newPage];
    
    this.setData({
      'work.pages': pages,
      currentPageIndex: pages.length - 1,
      selectedElementId: null
    });
  },

  // 返回按钮处理
  async onBackTap() {
    if (!this.data.isReady) return;

    try {
      const res = await wx.showModal({
        title: '保存草稿',
        content: '是否将当前作品保存为草稿？',
        confirmText: '保存',
        cancelText: '不保存'
      });

      if (res.confirm) {
        // 保存草稿
        await this.saveDraft();
        wx.showToast({
          title: '已保存草稿',
          icon: 'success'
        });
      }

      // 无论是否保存，都返回上一页
      wx.navigateBack();
    } catch (error) {
      console.error('返回处理失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 保存草稿
  async saveDraft() {
    const { work } = this.data;
    if (!work) return;

    try {
      await workService.saveDraft(work);
    } catch (error) {
      console.error('保存草稿失败:', error);
      throw error;
    }
  }
}); 