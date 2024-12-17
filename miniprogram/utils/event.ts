// 事件类型
type EventCallback = (...args: any[]) => void

// 事件工具类
class EventBus {
  private static instance: EventBus
  private events: Map<string, EventCallback[]>

  private constructor() {
    this.events = new Map()
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  // 订阅事件
  public on(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event) || []
    callbacks.push(callback)
    this.events.set(event, callbacks)
  }

  // 取消订阅
  public off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.events.delete(event)
      return
    }

    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
      if (callbacks.length === 0) {
        this.events.delete(event)
      }
    }
  }

  // 触发事件
  public emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Event callback error: ${error}`)
        }
      })
    }
  }

  // 只订阅一次
  public once(event: string, callback: EventCallback): void {
    const onceCallback = (...args: any[]) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }
}

// 导出事件实例
export const eventBus = EventBus.getInstance()

// 事件名称枚举
export enum EventName {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REFRESH = 'refresh',
  CREATE_WORK = 'createWork',
  DELETE_WORK = 'deleteWork',
  UPDATE_WORK = 'updateWork'
} 