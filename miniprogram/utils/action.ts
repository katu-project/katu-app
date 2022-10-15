import { sleep } from './base'

async function showInfo(msg, typeIdx=3, mask=true, options={}){
  const type = ['success', 'error', 'loading', 'none']
  return wx.showToast({
    title: msg,
    icon: type[typeIdx] as 'success' | 'error' | 'loading' | 'none',
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
async function showChoose(title, content='', options={}): Promise<WechatMiniprogram.ShowModalSuccessCallbackResult> {
  return new Promise((resolve)=>{
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

async function redirectTo(page, vibrate=false){
  vibrate && wx.vibrateShort({
    type: 'light',
  })
  wx.redirectTo({
    url: page,
  })
}

async function setClipboardData(data, vibrate=true){
  vibrate && wx.vibrateShort({
    type: 'light',
  })
  wx.setClipboardData({
    data
  })
}

async function navigateBack(backData={},delta=1){
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - delta - 1]
  prevPage.backData = backData
  wx.navigateBack({delta}).catch(e=>{
    redirectTo('/pages/home/index')
  })
}

async function switchTab(page, vibrate=true){
  vibrate && wx.vibrateShort({
    type: 'light',
  })
  wx.switchTab({
    url: page,
  })
}
type LoadDataOptions = {
  loadingTitle: string,
  returnFailed: boolean
}

async function loadData<T>(func?: (args:any) => Promise<T>, params?: Object, options?: Partial<LoadDataOptions> | string): Promise<T> {
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

export {
  showInfo,
  showSuccess,
  showChoose,
  showNotice,
  showError,
  showLoading,
  navigateTo,
  redirectTo,
  navigateBack,
  switchTab,
  loadData,
  setClipboardData
}