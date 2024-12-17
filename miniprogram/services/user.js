const userService = {
  // 检查登录状态
  async checkLoginState() {
    try {
      const storedUserInfo = wx.getStorageSync('userInfo');
      if (storedUserInfo) {
        return storedUserInfo;
      }
      return null;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return null;
    }
  },

  // 保存登录状态
  async saveLoginState(userInfo) {
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (error) {
      console.error('保存登录状态失败:', error);
    }
  },

  // 清除登录状态
  async clearLoginState() {
    try {
      wx.removeStorageSync('userInfo');
    } catch (error) {
      console.error('清除登录状态失败:', error);
    }
  },

  // 创建或更新用户信息
  async createOrUpdateUser(userInfo) {
    try {
      const db = wx.cloud.database();
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });

      if (!result || !result.openid) {
        throw new Error('获取用户ID失败');
      }

      const openId = result.openid;
      const userCollection = db.collection('users');

      // 查找是否已存在用户记录
      const { data } = await userCollection.where({
        _openid: openId
      }).get();

      let updatedUserInfo;
      if (data && data.length > 0) {
        // 更新用户信息
        await userCollection.doc(data[0]._id).update({
          data: {
            ...userInfo,
            updateTime: db.serverDate()
          }
        });
        updatedUserInfo = { ...data[0], ...userInfo };
      } else {
        // 创建新用户
        const result = await userCollection.add({
          data: {
            ...userInfo,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
        updatedUserInfo = { _id: result._id, ...userInfo };
      }

      // 保存登录状态
      await this.saveLoginState(updatedUserInfo);
      return updatedUserInfo;
    } catch (error) {
      console.error('创建或更新用户失败:', error);
      throw error;
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const db = wx.cloud.database();
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });

      if (!result || !result.openid) {
        throw new Error('获取用户ID失败');
      }

      const openId = result.openid;
      const userCollection = db.collection('users');

      const { data } = await userCollection.where({
        _openid: openId
      }).get();

      return data[0] || null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  // 更新用户头像
  async updateAvatar(avatarUrl) {
    try {
      const db = wx.cloud.database();
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });

      if (!result || !result.openid) {
        throw new Error('获取用户ID失败');
      }

      const openId = result.openid;
      const userCollection = db.collection('users');

      const { data } = await userCollection.where({
        _openid: openId
      }).get();

      if (data && data.length > 0) {
        await userCollection.doc(data[0]._id).update({
          data: {
            avatarUrl,
            updateTime: db.serverDate()
          }
        });
        return { ...data[0], avatarUrl };
      } else {
        throw new Error('用户不存在');
      }
    } catch (error) {
      console.error('更新头像失败:', error);
      throw error;
    }
  }
};

module.exports = {
  userService
}; 