/// <reference path="./wx/index.d.ts" />

// Global app type
interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null
    systemInfo: WechatMiniprogram.SystemInfo | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback
} 