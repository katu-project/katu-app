const { sleep } = require('./base')

async function showInfo(msg, typeIdx=3, mask=true){
  const type = ['success', 'error', 'loading', 'none']
  return wx.showToast({
    title: msg,
    icon: type[typeIdx],
    mask,
  })
}

// showChoose(title,content)
async function showChoose(title, content, options={}){
  return new Promise((resolve,reject)=>{
    wx.showModal({
      title,
      content,
      ...options
    }).then(({confirm, content})=>{
      if(confirm) return resolve(content)
      return reject()
    }).catch(reject)
  })
}

async function navigateTo(page, vibrate=false){
  vibrate && wx.vibrateShort({
    type: 'light',
  })
  wx.navigateTo({
    url: page,
  })
}

async function loadData(func, params={}){
  params = func ? params : 2000
  func = func || sleep
  wx.showLoading({
    title: '正在处理请求',
    mask: true
  })
  let res
  try {
    res = await func(params)
    await wx.hideLoading()
    return res
  } catch (error) {
    await wx.hideLoading()
    wx.showModal({
      title: '内部服务错误，请联系客服',
      content: error.message,
      showCancel: false,
      success: ({confirm})=>{
        if(!confirm) return
        wx.navigateTo({
          url: '/pages/profile/index',
        })
      }
    })
  }
}

module.exports = {
  showInfo,
  showChoose,
  navigateTo,
  loadData
}