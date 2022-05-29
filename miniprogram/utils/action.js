const { sleep } = require('./base')

async function showInfo(msg, typeIdx=3, mask=true, options={}){
  const type = ['success', 'error', 'loading', 'none']
  return wx.showToast({
    title: msg,
    icon: type[typeIdx],
    mask,
    ...options
  })
}

async function showSuccess(msg){
  return showInfo(msg,0)
}

async function showError(msg){
  return showInfo(msg, 1)
}

async function showLoading(msg, duration=500){
  return showInfo(msg,2, true, {duration})
}

async function showNotice(msg){
  return showInfo(msg)
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
      // return reject()
    }).catch(console.warn)
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
  let pfunc
  if(func){
    pfunc = async ()=> await func(params)
  }else{
    pfunc = sleep
    params = 2000
  }
  wx.showLoading({
    title: '正在处理请求',
    mask: true
  })

  return new Promise((resolve)=>{
    pfunc(params).then(res=>{
      resolve(res)
      wx.hideLoading()
    }).catch(error=>{
      wx.hideLoading({
        success: () => {
          if(error.code === 1){
            wx.showModal({
              title: '操作未完成',
              content: error.message,
              showCancel: false,
            })
          }else{
            console.warn(error.message)
            wx.showModal({
              title: `服务错误(${error.code})`,
              content: '请稍后重试或联系客服',
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
      })
    })
  })
}

module.exports = {
  showInfo,
  showSuccess,
  showChoose,
  showNotice,
  showError,
  showLoading,
  navigateTo,
  loadData
}