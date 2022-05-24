const crypto = require('./crypto')
const file = require('./file')

async function sleep(t=1000){
  return new Promise(r=>{
    setTimeout(r,t)
  })
}

async function loadData(func, params={}){
  func = func || sleep
  wx.showLoading({
    title: '数据加载中',
    mask: true
  })
  try {
    const res = await func(params)
    wx.nextTick(()=>{
      wx.hideLoading({})
    })
    return res
  } catch (error) {
    wx.showToast({
      title: error.message,
      icon: 'error'
    })
  }
}

module.exports = {
  crypto,
  file,
  loadData
}