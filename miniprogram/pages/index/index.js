Page({
  data: {
    works: [
      {
        id: '1',
        title: '示例作品1',
        coverImage: '/images/empty-state.svg',
        author: {
          id: '1',
          nickname: '用户1',
          avatar: '/images/empty-state.svg'
        },
        stats: {
          likes: 42,
          comments: 18,
          shares: 7
        }
      },
      {
        id: '2',
        title: '示例作品2',
        coverImage: '/images/empty-state.svg',
        author: {
          id: '2',
          nickname: '用户2',
          avatar: '/images/empty-state.svg'
        },
        stats: {
          likes: 38,
          comments: 15,
          shares: 5
        }
      }
    ]
  },

  onLoad: function() {
    // 页面加载时执行
  },

  onShow: function() {
    // 页面显示时执行
  },

  onWorkTap: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/work/detail?id=' + id,
      fail: function() {
        console.log('Navigation failed')
      }
    })
  },

  onCreateTap: function() {
    wx.switchTab({
      url: '/pages/create/create',
      fail: function() {
        console.log('Navigation failed')
      }
    })
  },

  onProfileTap: function() {
    wx.switchTab({
      url: '/pages/profile/profile',
      fail: function() {
        console.log('Navigation failed')
      }
    })
  }
}) 