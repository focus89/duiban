const { workApi } = require('./api');

class WorkService {
  // 保存草稿
  async saveDraft(work) {
    try {
      console.log('WorkService.saveDraft - 开始保存草稿:', work);
      
      // 确保作品有必要的字段
      work.isDraft = true;
      work.updateTime = Date.now();
      
      if (!work.id) {
        // 新建草稿
        console.log('WorkService.saveDraft - 创建新草稿');
        const result = await workApi.addDraft(work);
        console.log('WorkService.saveDraft - 创建结果:', result);
        return result;
      } else {
        // 更新草稿
        console.log('WorkService.saveDraft - 更新已有草稿');
        const result = await workApi.updateDraft(work);
        console.log('WorkService.saveDraft - 更新结果:', result);
        return result;
      }
    } catch (error) {
      console.error('WorkService.saveDraft - 保存草稿失败:', error);
      throw error;
    }
  }

  // 发布作品
  async publishWork(work) {
    try {
      work.isDraft = false;
      work.isPublished = true;  // 添加发布标记
      const result = await workApi.publishWork(work);
      return result;
    } catch (error) {
      console.error('发布作品失败:', error);
      throw error;
    }
  }

  // 获取草稿列表
  async getDrafts() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getDrafts'
      });

      if (!result || !result.success) {
        throw new Error(result?.error || '获取草稿列表失败');
      }

      return result;
    } catch (error) {
      console.error('获取草稿列表失败:', error);
      throw error;
    }
  }

  // 删除草稿
  async deleteDraft(draftId) {
    try {
      if (!draftId || (typeof draftId !== 'string' && typeof draftId !== 'number')) {
        throw new Error('草稿ID无效');
      }

      console.log('WorkService.deleteDraft - 开始删除草稿:', draftId);
      const { result } = await wx.cloud.callFunction({
        name: 'deleteDraft',
        data: { id: String(draftId) }
      });
      console.log('WorkService.deleteDraft - 云函数返回结果:', result);

      if (!result || !result.success) {
        throw new Error(result?.error || '删除失败');
      }
      return result;
    } catch (error) {
      console.error('WorkService.deleteDraft - 删除草稿失败:', error);
      throw error;
    }
  }

  // 获取作品列表
  async getWorks(filter = {}) {
    try {
      console.log('WorkService.getWorks - 开始获取作品列表, 过滤条件:', filter);
      const { result } = await wx.cloud.callFunction({
        name: 'getWorks',
        data: { filter }
      });
      console.log('WorkService.getWorks - 云函数返回结果:', result);

      if (!result || !result.success) {
        console.error('WorkService.getWorks - 云函数调用失败:', result?.error);
        throw new Error(result?.error || '获取作品列表失败');
      }

      const works = result.works || [];
      console.log('WorkService.getWorks - 处理后的作品列表:', works);
      return works;
    } catch (error) {
      console.error('WorkService.getWorks - 发生错误:', error);
      throw error;
    }
  }

  // 获取单个作品
  async getWork(id) {
    try {
      console.log('WorkService.getWork - 开始获取作品:', id);
      const result = await workApi.getWork(id);
      console.log('WorkService.getWork - API返回结果:', result);

      if (!result || !result.success) {
        console.error('WorkService.getWork - API调用失败:', result?.error);
        throw new Error(result?.error || '获取作品失败');
      }

      console.log('WorkService.getWork - 处理后的作品数据:', result.work);
      return result.work;
    } catch (error) {
      console.error('WorkService.getWork - 发生错误:', error);
      throw error;
    }
  }

  // 删除作品
  async deleteWork(id) {
    try {
      const result = await workApi.deleteWork(id);
      if (!result || !result.success) {
        throw new Error(result?.error || '删除失败');
      }
      return result;
    } catch (error) {
      console.error('删除作品失败:', error);
      throw error;
    }
  }

  // 更新作品统计信息
  async updateStats(id, type) {
    try {
      console.log('WorkService.updateStats - 开始更新统计信息:', { id, type });
      const result = await workApi.updateStats(id, type);
      console.log('WorkService.updateStats - API返回结果:', result);

      if (!result || !result.success) {
        console.error('WorkService.updateStats - API调用失败:', result?.error);
        throw new Error(result?.error || '更新统计失败');
      }

      return result;
    } catch (error) {
      console.error('WorkService.updateStats - 发生错误:', error);
      // 如果是浏览量统计失败，我们可以忽略这个错误，不影响用户体验
      if (type === 'view') {
        console.warn('WorkService.updateStats - 忽略浏览量统计失败');
        return { success: true };
      }
      throw error;
    }
  }

  // 获取单个草稿
  async getDraft(draftId) {
    try {
      console.log('WorkService.getDraft - 开始获取草稿:', draftId);
      const result = await wx.cloud.callFunction({
        name: 'getDraft',
        data: { id: draftId }
      });
      console.log('WorkService.getDraft - 云函数返回结果:', result);

      if (!result.result || !result.result.success) {
        console.error('WorkService.getDraft - API调用失败:', result.result?.error);
        throw new Error(result.result?.error || '获取草稿失败');
      }

      const draft = result.result.draft;
      if (!draft) {
        console.error('WorkService.getDraft - 草稿数据无效');
        throw new Error('草稿数据无效');
      }

      // 确保草稿数据结构完整
      if (!draft.pages) {
        draft.pages = [{
          id: Date.now().toString(),
          elements: [],
          backgroundColor: '#ffffff'
        }];
      }

      // 确保每个页面都有正确的数据结构
      draft.pages = draft.pages.map(page => ({
        id: page.id || Date.now().toString(),
        elements: page.elements || [],
        backgroundColor: page.backgroundColor || '#ffffff'
      }));

      return {
        success: true,
        draft: draft
      };
    } catch (error) {
      console.error('WorkService.getDraft - 获取草稿失败:', error);
      throw error;
    }
  }
}

const workService = new WorkService();

module.exports = {
  workService
}; 