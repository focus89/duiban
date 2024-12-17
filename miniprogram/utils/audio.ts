// 音频管理器类
class AudioManager {
  private static instance: AudioManager
  private bgmContext: WechatMiniprogram.BackgroundAudioManager | null = null
  private effectContexts: Map<string, WechatMiniprogram.InnerAudioContext> = new Map()

  private constructor() {
    this.initBackgroundAudio()
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  // 初始化背景音乐
  private initBackgroundAudio(): void {
    this.bgmContext = wx.getBackgroundAudioManager()
    this.bgmContext.onError((res) => {
      wx.getLogManager().error('Background audio error:', res.errMsg)
    })
  }

  // 播放背景音乐
  public playBGM(src: string, title: string = '背景音乐'): void {
    if (this.bgmContext) {
      this.bgmContext.title = title
      this.bgmContext.src = src
      this.bgmContext.play()
    }
  }

  // 暂停背景音乐
  public pauseBGM(): void {
    if (this.bgmContext) {
      this.bgmContext.pause()
    }
  }

  // 停止背景音乐
  public stopBGM(): void {
    if (this.bgmContext) {
      this.bgmContext.stop()
    }
  }

  // 创建音效上下文
  private createEffectContext(src: string): WechatMiniprogram.InnerAudioContext {
    const context = wx.createInnerAudioContext()
    context.src = src
    context.onError((res) => {
      console.error('Audio effect error:', res.errMsg)
    })
    return context
  }

  // 播放音效
  public playEffect(key: string, src: string): void {
    let context = this.effectContexts.get(key)
    
    if (!context) {
      context = this.createEffectContext(src)
      this.effectContexts.set(key, context)
    }

    context.stop()
    context.play()
  }

  // 停止音效
  public stopEffect(key: string): void {
    const context = this.effectContexts.get(key)
    if (context) {
      context.stop()
    }
  }

  // 停止所有音效
  public stopAllEffects(): void {
    this.effectContexts.forEach(context => {
      context.stop()
    })
  }

  // 销毁音效上下文
  public destroyEffect(key: string): void {
    const context = this.effectContexts.get(key)
    if (context) {
      context.destroy()
      this.effectContexts.delete(key)
    }
  }

  // 销毁所有音效上下文
  public destroyAllEffects(): void {
    this.effectContexts.forEach(context => {
      context.destroy()
    })
    this.effectContexts.clear()
  }
}

// 导出音频管理器实例
export const audioManager = AudioManager.getInstance()

// 音效类型枚举
export enum SoundEffect {
  CLICK = 'click',
  SUCCESS = 'success',
  FAIL = 'fail',
  POP = 'pop',
  MATCH = 'match',
  DROP = 'drop'
} 