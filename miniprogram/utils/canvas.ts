// 画布工具类
class CanvasManager {
  private static instance: CanvasManager
  private ctx: WechatMiniprogram.CanvasContext | null = null
  private canvasId: string = ''

  private constructor() {}

  public static getInstance(): CanvasManager {
    if (!CanvasManager.instance) {
      CanvasManager.instance = new CanvasManager()
    }
    return CanvasManager.instance
  }

  // 初始化画布
  public init(canvasId: string, component: any): void {
    this.canvasId = canvasId
    this.ctx = wx.createCanvasContext(canvasId, component)
  }

  // 清空画布
  public clear(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, 0, 0)
      this.ctx.draw()
    }
  }

  // 绘制图片
  public drawImage(
    src: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotate: number = 0
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ctx) {
        reject(new Error('Canvas context not initialized'))
        return
      }

      this.ctx.save()
      
      // 设置旋转中心点
      if (rotate !== 0) {
        const centerX = x + width / 2
        const centerY = y + height / 2
        this.ctx.translate(centerX, centerY)
        this.ctx.rotate((rotate * Math.PI) / 180)
        this.ctx.translate(-centerX, -centerY)
      }

      this.ctx.drawImage(src, x, y, width, height)
      this.ctx.restore()
      this.ctx.draw(true, () => {
        resolve()
      })
    })
  }

  // 绘制文本
  public drawText(
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number
      fontWeight?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      maxWidth?: number
    } = {}
  ): void {
    if (!this.ctx) return

    const {
      fontSize = 14,
      fontWeight = 'normal',
      color = '#000000',
      textAlign = 'left',
      maxWidth
    } = options

    this.ctx.save()
    this.ctx.setFontSize(fontSize)
    this.ctx.setFillStyle(color)
    this.ctx.setTextAlign(textAlign)
    
    if (maxWidth) {
      this.ctx.fillText(text, x, y, maxWidth)
    } else {
      this.ctx.fillText(text, x, y)
    }
    
    this.ctx.restore()
    this.ctx.draw(true)
  }

  // 绘制矩形
  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: string
      strokeColor?: string
      lineWidth?: number
      rotate?: number
    } = {}
  ): void {
    if (!this.ctx) return

    const {
      fillColor,
      strokeColor,
      lineWidth = 1,
      rotate = 0
    } = options

    this.ctx.save()

    // 设置旋转
    if (rotate !== 0) {
      const centerX = x + width / 2
      const centerY = y + height / 2
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate((rotate * Math.PI) / 180)
      this.ctx.translate(-centerX, -centerY)
    }

    // 设置填充色
    if (fillColor) {
      this.ctx.setFillStyle(fillColor)
      this.ctx.fillRect(x, y, width, height)
    }

    // 设置边框
    if (strokeColor) {
      this.ctx.setStrokeStyle(strokeColor)
      this.ctx.setLineWidth(lineWidth)
      // Use stroke() after drawing the rect path
      this.ctx.rect(x, y, width, height)
      this.ctx.stroke()
    }

    this.ctx.restore()
    this.ctx.draw(true)
  }

  // 保存画布为图片
  public saveToImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.canvasId) {
        reject(new Error('Canvas ID not set'))
        return
      }

      wx.canvasToTempFilePath({
        canvasId: this.canvasId,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }
}

// 导出画布管理器实例
export const canvasManager = CanvasManager.getInstance() 