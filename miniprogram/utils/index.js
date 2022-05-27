const crypto = require('./crypto')
const file = require('./file')
const convert = require('./convert')

async function sleep(t=2000){
  return new Promise((resolve,reject)=>{
    setTimeout(resolve,t)
  })
}

async function loadData(func, params={}){
  params = func ? params : 2000
  func = func || sleep
  wx.showLoading({
    title: '正在处理请求',
    mask: true
  })
  try {
    const res = await func(params)
    wx.nextTick(()=>{
      wx.hideLoading({})
    })
    return res
  } catch (error) {
    wx.hideLoading({
      success: (res) => {
        wx.showModal({
          title: '内部服务错误，请联系客服',
          content: error.message,
          showCancel: false,
          success: ({cancel})=>{
            if(cancel) return
            wx.navigateTo({
              url: '/pages/profile/index',
            })
          }
        })
      },
    })
  }
}

module.exports = {
  crypto,
  file,
  convert,
  loadData
}