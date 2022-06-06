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
async function showChoose(title, content='', options={}){
  return new Promise((resolve,reject)=>{
    wx.showModal({
      title,
      content,
      ...options
    }).then((e)=>{
      return resolve(e)
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

async function loadData(func, params, options){
  let loadingTitle = '正在处理请求', returnFailed = false
  if(options){
    if(typeof options === 'string'){
      loadingTitle = options
    }else{
      loadingTitle = options.loadingTitle || loadingTitle
      returnFailed = options.returnFailed || false
    }
  }
  let pfunc
  if(func){
    pfunc = async p => await func(p)
  }else{
    pfunc = sleep
    params = 2000
  }
  wx.showLoading({
    title: loadingTitle,
    mask: true
  })

  return new Promise((resolve,reject)=>{
    pfunc(params).then(res=>{
      resolve(res)
      wx.hideLoading()
    }).catch(error=>{
      wx.hideLoading({
        success: () => {
          if(returnFailed) return reject(error)
          if(!error.code || error.code === 1){
            wx.showModal({
              title: '操作未完成',
              content: error.message,
              showCancel: false,
            })
          }else{
            console.warn(error)
            const showContent = error.code ? `错误代码: ${error.code}` : ''
            wx.showModal({
              title: `服务错误`,
              content: `请稍后重试\n${showContent}`,
              confirmText: '联系客服',
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