// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'duiban-0gzskn859c8dc2c8'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
} 