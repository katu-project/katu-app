import { sleep, toPromise } from './base'

async function showInfo(msg, typeIdx=3, mask=true, options={}){
  const type = ['success', 'error', 'loading', 'none']
  return wx.showToast({
    title: msg,
    icon: type[typeIdx] as 'success' | 'error' | 'loading' | 'none',
    mask,
    ...options
  })
}

async function showError(msg){
  return showInfo(msg, 1)
}

async function showLoading(msg, duration=500){
  return new Promise((resolve)=>{
    wx.showLoading({
      title: msg,
    })
    sleep(duration).then(()=>{
      wx.hideLoading()
      resolve('')
    })
  })
}

async function showNotice(msg){
  return showInfo(msg)
}

// showChoose(title,content)
async function showChoose(title:string, content?:string, options?: WechatMiniprogram.ShowModalOption): Promise<WechatMiniprogram.ShowModalSuccessCallbackResult> {
  return new Promise((resolve)=>{
    wx.showModal({
      title,
      content: content || '',
      ...(options || {})
    }).then((e)=>{
      return resolve(e)
    }).catch(console.warn)
  })
}

async function scanQrcode(options?:WechatMiniprogram.ScanCodeOption){
  const res = await wx.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    ...options
  })
  console.debug('scanQrcode',res)
  if(!res.result) throw Error('无效二维码')
  try {
    return JSON.parse(res.result)
  } catch (_) {}
  return res.result
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

async function navigateBack(options?:{delta?: number}){
  const delta = options?.delta || 1
  wx.navigateBack({delta})
}

export async function openPrivacyContract(){
  const func = args => wx.openPrivacyContract(args)
  func.noLog = true
  return toPromise(func, {})
}

export async function getPrivacySetting(){
  const func = args => wx.getPrivacySetting(args)
  func.noLog = true
  return toPromise<{needAuthorization:boolean,privacyContractName:string}>(func, {})
}

async function switchTab(page:string, vibrate?:boolean){
  vibrate && wx.vibrateShort({
    type: 'light',
    fail: console.warn
  })
  wx.switchTab({
    url: page,
  })
}

type LoadDataOptions = {
  hideLoading: boolean,
  loadingTitle: string,
  returnFailed: boolean
}

async function loadData<T>(func?: (args?:any) => Promise<T>, params?: Object, options?: Partial<LoadDataOptions> | string): Promise<T> {
  let loadingTitle = '正在处理请求', returnFailed = false, hideLoading = false
  if(options){
    if(typeof options === 'string'){
      loadingTitle = options
    }else{
      loadingTitle = options.loadingTitle || loadingTitle
      returnFailed = options.returnFailed || false
      hideLoading = options.hideLoading || false
    }
  }
  let pfunc: (p?:any)=>unknown = ()=> sleep(2000)
  
  if(func){
    pfunc = async p => {
      return func(p)
    } 
  }

  if(hideLoading){
    console.log("静默操作")
  }else{
    wx.showLoading({
      title: loadingTitle,
      mask: true
    })
  }

  await sleep(300)

  const timeoutCheck = new Promise(async (_,reject)=>{
    await sleep(10000)
    reject({
      message: '服务超时，请重试或刷新小程序'
    })
  })

  return new Promise((resolve,reject)=>{
    Promise.race([
      pfunc(params),
      timeoutCheck
    ]).then(res=>{
      wx.hideLoading({
        complete: ()=>{
          resolve(res as T)
        }
      })
    }).catch(error=>{
      wx.hideLoading({
        complete: () => {
          if(returnFailed) return reject(error)
          if(!error.code || error.code === 1){
            if(error.errMsg && ['scanCode:fail cancel'].includes(error.errMsg)){
              wx.showToast({
                title: '操作取消',
                icon: 'none'
              })
            }else{
              wx.showModal({
                title: '操作错误',
                content: error.message || error.errMsg || '未知错误',
                showCancel: false,
              })
            }
          }else{
            console.warn(error)
            const showContent = error.code ? `错误代码: ${error.code}` : ''
            const showModalOption: WechatMiniprogram.ShowModalOption = {
              title: `服务错误`,
              content: `${error.message || '请稍后重试'}\n${showContent}`,
              confirmText: '联系客服',
              showCancel: false,
              success: ({confirm})=>{
                if(!confirm) return
                wx.redirectTo({
                  url: '/pages/about/contact/index',
                })
              },
              fail: ()=>{
                wx.reLaunch({
                  url: '/pages/home/index',
                })
              }
            }
            // 400以上是用户账户相关问题
            if(error.code.toString().startsWith('4')){
              showModalOption.title = '账户状态异常'
            }
            // 500以上是应用程序出错
            if(error.code.toString().startsWith('5')){
              showModalOption.title = '服务异常'
              showModalOption.content = '很抱歉，服务暂时不可用'
              showModalOption.showCancel = true
            }

            if(!showModalOption.success){
              showModalOption.success = ({confirm})=>{
                if(!confirm) return
                wx.reLaunch({
                  url: '/pages/home/index',
                })
              }
            }

            wx.showModal(showModalOption)
          }
        }
      })
    })
  })
}

async function chooseLocalImage(){
  try {
    const pics = await wx.chooseMedia({
      count: 1,
      mediaType: ['image']
    })

    if(!pics.tempFiles.length) return
    const tempFile = pics.tempFiles[0]
    return tempFile.tempFilePath
  } catch (error:any) {
    if(error?.errMsg === 'chooseMedia:fail cancel'){
      wx.showToast({
        title: '取消选择',
        icon: 'none'
      })
      return
    }
    throw error
  }
}

async function editImage(src){
  const editImage = args => wx.editImage(args)
  editImage.noLog = true
  const args = {src}
  return toPromise<string>(editImage, args, 'tempFilePath')
}

export {
  showInfo,
  showChoose,
  showNotice,
  showError,
  showLoading,
  navigateTo,
  redirectTo,
  navigateBack,
  switchTab,
  loadData,
  setClipboardData,
  chooseLocalImage,
  editImage,
  scanQrcode
}