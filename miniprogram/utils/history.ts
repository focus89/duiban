/**
 * 历史记录管理类
 * 用于管理编辑操作的撤销和重做功能
 */
class HistoryManager {
  private history: any[];
  private currentIndex: number;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 50) {
    this.history = [];  // 历史记录栈
    this.currentIndex = -1;  // 当前历史记录位置
    this.maxHistorySize = maxHistorySize;  // 最大历史记录数量
  }

  /**
   * 添加新的历史记录
   * @param state - 当前状态
   */
  push(state: any): void {
    // 如果当前不在最新状态，清除当前位置之后的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新记录
    this.history.push(this.cloneState(state));
    this.currentIndex++;

    // 如果超出最大记录数，移除最早的记录
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * 撤销操作
   * @returns 返回上一个状态，如果无法撤销则返回null
   */
  undo(): any | null {
    if (!this.canUndo()) {
      return null;
    }
    this.currentIndex--;
    return this.cloneState(this.history[this.currentIndex]);
  }

  /**
   * 重做操作
   * @returns 返回下一个状态，如果无法重做则返回null
   */
  redo(): any | null {
    if (!this.canRedo()) {
      return null;
    }
    this.currentIndex++;
    return this.cloneState(this.history[this.currentIndex]);
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 深拷贝状态对象
   * @param state - 需要克隆的状态对象
   */
  private cloneState(state: any): any {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * 获取当前历史记录大小
   */
  size(): number {
    return this.history.length;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): any | null {
    if (this.currentIndex >= 0) {
      return this.cloneState(this.history[this.currentIndex]);
    }
    return null;
  }
}

export default HistoryManager; 