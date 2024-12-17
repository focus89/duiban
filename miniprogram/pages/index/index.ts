import { workStore } from '../../store/work'

interface IPageData {
  workList: {
    works: any[];
    totalCount: number;
    cursor?: string;
  };
  currentPageIndex: number;
  isLoading: boolean;
  isPlaying: boolean;
  currentAudioId: string;
}

Page<IPageData>({
  data: {
    workList: {
      works: [],
      totalCount: 0
    },
    currentPageIndex: 0,
    isLoading: true,
    isPlaying: false,
    currentAudioId: ''
  },

  audioContext: null as WechatMiniprogram.InnerAudioContext | null,

  onLoad() {
    this.loadWorks(true)
  },

  onPullDownRefresh() {
    this.loadWorks(true)
  },

  onReachBottom() {
    if (this.data.workList.cursor) {
      this.loadWorks(false)
    }
  },

  async loadWorks(refresh: boolean) {
    try {
      this.setData({ isLoading: true })
      const workList = await workStore.loadRecommendedWorks(refresh)
      this.setData({ 
        workList,
        isLoading: false
      })
      wx.stopPullDownRefresh()
    } catch (error) {
      console.error('Failed to load works:', error)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  onWorkChange(e: WechatMiniprogram.TouchEvent) {
    const { current } = e.detail
    // 如果是最后一个作品，加载更多
    if (current === this.data.workList.works.length - 1 && this.data.workList.cursor) {
      this.loadWorks(false)
    }
    // 重置页面索引
    this.setData({ currentPageIndex: 0 })
    // 停止当前音频
    this.stopCurrentAudio()
  },

  onPageChange(e: WechatMiniprogram.TouchEvent) {
    const { current } = e.detail
    this.setData({ currentPageIndex: current })
    // 停止当前音频
    this.stopCurrentAudio()
  },

  async onLikeTap(e: WechatMiniprogram.TouchEvent) {
    const { workId } = e.currentTarget.dataset
    try {
      await workStore.updateStats(workId, 'like')
      // 更新本地数据
      const { workList } = this.data
      const workIndex = workList.works.findIndex(w => w.id === workId)
      if (workIndex !== -1) {
        const work = workList.works[workIndex]
        const isLiked = !work.isLiked
        this.setData({
          [`workList.works[${workIndex}].isLiked`]: isLiked,
          [`workList.works[${workIndex}].stats.likes`]: work.stats.likes + (isLiked ? 1 : -1)
        })
      }
    } catch (error) {
      console.error('Failed to update like:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  onShareTap(e: WechatMiniprogram.TouchEvent) {
    const { workId } = e.currentTarget.dataset
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onAudioTap(e: WechatMiniprogram.TouchEvent) {
    const { element } = e.currentTarget.dataset
    if (this.data.isPlaying && this.data.currentAudioId === element.id) {
      this.stopCurrentAudio()
    } else {
      this.playAudio(element)
    }
  },

  playAudio(element: any) {
    this.stopCurrentAudio()
    const audioContext = wx.createInnerAudioContext()
    audioContext.src = element.url
    audioContext.loop = element.loop
    audioContext.play()
    this.audioContext = audioContext
    this.setData({
      isPlaying: true,
      currentAudioId: element.id
    })

    audioContext.onEnded(() => {
      this.setData({
        isPlaying: false,
        currentAudioId: ''
      })
    })
  },

  stopCurrentAudio() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }
    this.setData({
      isPlaying: false,
      currentAudioId: ''
    })
  },

  onShareAppMessage(res: any) {
    const currentWork = this.data.workList.works[this.data.currentPageIndex]
    return {
      title: `${currentWork.author.name}的作品`,
      path: `/pages/index/index?workId=${currentWork.id}`,
      imageUrl: currentWork.pages[0]?.elements.find((e: any) => e.type === 'image')?.url
    }
  },

  onUnload() {
    this.stopCurrentAudio()
  }
}) 