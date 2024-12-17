import { Work, WorkList, Page, WorkDraft } from '../types/work';
import { storage } from '../utils/storage';

const DRAFTS_KEY = 'work_drafts';

class WorkService {
  // 获取推荐作品列表
  async getRecommendedWorks(cursor?: string): Promise<WorkList> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'getRecommendedWorks',
        data: { cursor }
      });
      return response.result as WorkList;
    } catch (error) {
      console.error('Failed to get recommended works:', error);
      throw error;
    }
  }

  // 获取单个作品详情
  async getWorkById(workId: string): Promise<Work> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'getWork',
        data: { workId }
      });
      return response.result as Work;
    } catch (error) {
      console.error('Failed to get work:', error);
      throw error;
    }
  }

  // 创建新作品
  async createWork(work: Omit<Work, 'id' | 'createTime' | 'updateTime' | 'stats'>): Promise<Work> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'createWork',
        data: { work }
      });
      return response.result as Work;
    } catch (error) {
      console.error('Failed to create work:', error);
      throw error;
    }
  }

  // 更新作品
  async updateWork(workId: string, updates: Partial<Work>): Promise<Work> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'updateWork',
        data: { workId, updates }
      });
      return response.result as Work;
    } catch (error) {
      console.error('Failed to update work:', error);
      throw error;
    }
  }

  // 删除作品
  async deleteWork(workId: string): Promise<boolean> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'deleteWork',
        data: { workId }
      });
      return response.result.success;
    } catch (error) {
      console.error('Failed to delete work:', error);
      throw error;
    }
  }

  // 更新作品统计信息
  async updateWorkStats(workId: string, type: 'view' | 'like' | 'share'): Promise<void> {
    try {
      await wx.cloud.callFunction({
        name: 'updateWorkStats',
        data: { workId, type }
      });
    } catch (error) {
      console.error('Failed to update work stats:', error);
      throw error;
    }
  }

  // 获取用户的作品列表
  async getUserWorks(userId: string, cursor?: string): Promise<WorkList> {
    try {
      const response = await wx.cloud.callFunction({
        name: 'getUserWorks',
        data: { userId, cursor }
      });
      return response.result as WorkList;
    } catch (error) {
      console.error('Failed to get user works:', error);
      throw error;
    }
  }

  // 保存草稿
  async saveDraft(work: Work): Promise<WorkDraft> {
    const drafts = await this.getDrafts();
    const now = Date.now();
    
    // 查找是否已存在草稿
    let draft = drafts.find(d => d.workId === work.id || d.id === work.draftId);
    
    if (draft) {
      // 更新已有草稿
      draft.work = work;
      draft.updateTime = now;
    } else {
      // 创建新草稿
      draft = {
        id: now.toString(),
        workId: work.id || undefined,
        work: {
          ...work,
          isDraft: true
        },
        createTime: now,
        updateTime: now
      };
      drafts.push(draft);
    }

    // 存草稿列表
    await storage.set(DRAFTS_KEY, drafts);
    return draft;
  },

  // 获取草稿列表
  async getDrafts(): Promise<WorkDraft[]> {
    const drafts = await storage.get<WorkDraft[]>(DRAFTS_KEY) || [];
    return drafts.sort((a, b) => b.updateTime - a.updateTime);
  },

  // 获取单个草稿
  async getDraft(draftId: string): Promise<WorkDraft | null> {
    const drafts = await this.getDrafts();
    return drafts.find(d => d.id === draftId) || null;
  },

  // 删除草稿
  async deleteDraft(draftId: string): Promise<void> {
    const drafts = await this.getDrafts();
    const newDrafts = drafts.filter(d => d.id !== draftId);
    await storage.set(DRAFTS_KEY, newDrafts);
  }
}

export const workService = new WorkService(); 