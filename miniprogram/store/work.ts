import { Work, WorkList } from '../types/work';
import { workService } from '../services/work';

class WorkStore {
  private currentWork: Work | null = null;
  private workList: WorkList | null = null;
  private currentPage = 0;

  // 加载推荐作品列表
  async loadRecommendedWorks(refresh = false) {
    try {
      const cursor = refresh ? undefined : this.workList?.cursor;
      const newWorkList = await workService.getRecommendedWorks(cursor);
      
      if (refresh) {
        this.workList = newWorkList;
      } else {
        this.workList = {
          ...newWorkList,
          works: [...(this.workList?.works || []), ...newWorkList.works]
        };
      }
      
      if (!this.currentWork && this.workList.works.length > 0) {
        this.currentWork = this.workList.works[0];
        this.currentPage = 0;
      }
      
      return this.workList;
    } catch (error) {
      console.error('Failed to load recommended works:', error);
      throw error;
    }
  }

  // 切换当前作品
  switchWork(direction: 'prev' | 'next'): boolean {
    if (!this.workList?.works.length) return false;

    const currentIndex = this.workList.works.findIndex(w => w.id === this.currentWork?.id);
    if (currentIndex === -1) return false;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < this.workList.works.length) {
      this.currentWork = this.workList.works[newIndex];
      this.currentPage = 0;
      return true;
    }

    return false;
  }

  // 切换页面
  switchPage(direction: 'prev' | 'next'): boolean {
    if (!this.currentWork) return false;

    const totalPages = this.currentWork.pages.length;
    let newPage = direction === 'next' ? this.currentPage + 1 : this.currentPage - 1;

    if (newPage >= 0 && newPage < totalPages) {
      this.currentPage = newPage;
      return true;
    }

    return false;
  }

  // 获取当前作品
  getCurrentWork(): Work | null {
    return this.currentWork;
  }

  // 获取当前页面
  getCurrentPage() {
    if (!this.currentWork) return null;
    return this.currentWork.pages[this.currentPage];
  }

  // 获取当前页码
  getCurrentPageIndex(): number {
    return this.currentPage;
  }

  // 获取作品列表
  getWorkList(): WorkList | null {
    return this.workList;
  }

  // 更新作品统计
  async updateStats(type: 'view' | 'like' | 'share') {
    if (!this.currentWork) return;
    
    try {
      await workService.updateWorkStats(this.currentWork.id, type);
      
      // 更新本地统计数据
      if (this.currentWork && this.workList) {
        const updatedWork = {
          ...this.currentWork,
          stats: {
            ...this.currentWork.stats,
            [type + 's']: this.currentWork.stats[type + 's' as keyof typeof this.currentWork.stats] + 1
          }
        };
        
        this.currentWork = updatedWork;
        
        // 更新列表中的作品数据
        const workIndex = this.workList.works.findIndex(w => w.id === updatedWork.id);
        if (workIndex !== -1) {
          this.workList.works[workIndex] = updatedWork;
        }
      }
    } catch (error) {
      console.error('Failed to update work stats:', error);
      throw error;
    }
  }
}

export const workStore = new WorkStore(); 