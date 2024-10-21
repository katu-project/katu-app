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

async function showLoading(msg, duration=500, mask?:boolean):Promise<()=>Promise<any>>{
  return new Promise((resolve)=>{
    wx.showLoading({
      title: msg,
      mask: mask || false
    })
    if(duration === -1) return resolve(()=>wx.hideLoading())
    sleep(duration).then(()=>{
      wx.hideLoading()
      resolve(()=>Promise.resolve())
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
  let scanRes
  try {
    const res = await wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      ...options
    })
    scanRes = res.result
  } catch (error:any) {
    if(['scanCode:fail cancel'].includes(error.errMsg)){
      throw error
    }
    throw Error('Invalid QR Code')
  }
  console.debug('scanQrcode',scanRes)
  if(!scanRes) throw Error('Invalid QR Code')
  try {
    return JSON.parse(scanRes)
  } catch (_) {}
  return scanRes
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
  hideLoading: boolean
  loadingTitle: string
  returnFailed: boolean
  failedContent: string | undefined
  failedNoticeCancel: {
    text: string
    action: ()=>any
  }
  timeout: number,
  finally: ()=>void
}

/**
 * 1. the finallyAction only invoke after Promise.race, no promise invoke after then
 * @param func 
 * @param params 
 * @param options 
 * @returns 
 */
async function loadData<T extends AnyFunction>(
  func?: T,
  params?: Parameters<T>[0],
  options?: Partial<LoadDataOptions> | string
  ): Promise<Awaited<ReturnType<T>>>
  {
  let loadingTitle = '正在处理请求', 
      returnFailed = false,
      hideLoading = false,
      failedContent,
      timeout = 10000,
      failedNoticeCancel: LoadDataOptions['failedNoticeCancel'] | undefined,
      finallyAction: AnyFunction | undefined
  if(options){
    if(typeof options === 'string'){
      loadingTitle = options
    }else{
      loadingTitle = options.loadingTitle || loadingTitle
      returnFailed = options.returnFailed || false
      hideLoading = options.hideLoading || false
      failedContent = options.failedContent
      timeout = options.timeout || 10000
      failedNoticeCancel = options.failedNoticeCancel
      finallyAction = options.finally
    }
  }
  let pfunc: (p?:any)=>unknown = ()=> sleep(2000)
  
  if(func){
    pfunc = async p => {
      return func(p)
    } 
  }

  if(hideLoading){
    console.log("Operate silently")
  }else{
    wx.showLoading({
      title: loadingTitle,
      mask: true
    })
    await sleep(300)
  }

  const timeoutCheck = new Promise((_,reject)=>{
    if(timeout > 0){
      sleep(timeout).then(()=>{
        reject({
          message: '服务超时，请稍后再试'
        })
      })
    }
  })

  const hidenLoadingFunc = ()=>{
    wx.hideLoading({
      fail: (e)=>{
        console.error('wx.hideLoading',e)
      }
    })
  }

  return new Promise<Awaited<ReturnType<T>>>((resolve,reject)=>{
    Promise.race([
      pfunc(params),
      timeoutCheck
    ])
    .then(res=>{
      if(!hideLoading){
        hidenLoadingFunc()
      }
      resolve(res as ReturnType<T>)
    })
    .catch(error=>{
      if(!hideLoading){
        hidenLoadingFunc()
      }
      console.error('loadData', func?.name||'No Name', params||'No Params', error)
      if(Object.hasOwnProperty ? Object.hasOwnProperty.call(error,'code'): error.code){ // 业务错误代码
        if(error.code === 1){ // 普通业务错误代码
          wx.showModal({
            title: '操作错误',
            content: failedContent || error.message.toString() || '未知错误',
            showCancel: failedNoticeCancel ? true : false,
            cancelText: failedNoticeCancel?.text || '取消',
            success: res=>{
              if(failedNoticeCancel && res.cancel){
                failedNoticeCancel.action()
              }
            }
          })
          if(returnFailed) return reject(error)
        }else{ // 特殊业务错误代码
          const showContent = `错误代码: ${error.code}`
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
            if(error.code == 401){
              showModalOption.title = '请求错误'
              showModalOption.content = '登录失效，请重新登录'
              showModalOption.showCancel = true
              showModalOption.confirmText = '去登录'
              showModalOption.success = ({confirm})=>{
                if(!confirm) return
                wx.navigateTo({
                  url: '/pages/auth/index',
                })
              }
            }
          }
          // 500以上是应用程序出错
          if(error.code.toString().startsWith('5')){
            showModalOption.title = '服务异常'
            showModalOption.content = '很抱歉，服务暂时不可用'
            showModalOption.showCancel = true
          }

          // 600是 api 底层请求错误
          if(error.code.toString().startsWith('6')){
            showModalOption.title = '网络环境异常'
            showModalOption.content = error?.message || '请检查应用网络设置后重试'
            showModalOption.showCancel = true
            showModalOption.confirmText = '查看设置'
            showModalOption.success = ({confirm})=>{
              if(!confirm) return
              wx.openAppAuthorizeSetting({
                fail: console.error
              })
            }
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
      }else{ // 小程序内部错误
        if(error.errMsg && ['scanCode:fail cancel'].includes(error.errMsg)){
          wx.showToast({
            title: '操作取消',
            icon: 'none'
          })
        }else{
          wx.showModal({
            title: '操作错误',
            content: error.errMsg || error.message || error,
            showCancel: false,
          })
        }
      } 
    })
    .finally(()=>{
      finallyAction && finallyAction()
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

async function checkIdentitySession(){
  const checkSession = args => wx.checkIdentitySession(args)
  checkSession.noLog = true
  const args = {}
  return toPromise<any>(checkSession, args)
}

async function weixinMiniProgramLogin(){
  const weixinMiniProgramLogin = args => wx.weixinMiniProgramLogin(args)
  weixinMiniProgramLogin.noLog = true
  const args = {}
  return toPromise<string>(weixinMiniProgramLogin, args, 'code')
}

export async function appleLogin(){
  const appleLogin = args => wx.appleLogin(args)
  appleLogin.noLog = true
  const args = {}
  return toPromise<string>(appleLogin, args, 'code')
}

async function weixinLogout(){
  const weixinLogout = args => wx.logout(args)
  weixinLogout.noLog = true
  const args = {}
  return toPromise<any>(weixinLogout, args)
}

async function hasWechatInstall(){
  const hasWechatInstall = args => wx.miniapp.hasWechatInstall(args)
  hasWechatInstall.noLog = true
  const args = {}
  return toPromise<boolean>(hasWechatInstall, args, 'hasWechatInstall')
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
  scanQrcode,
  checkIdentitySession,
  weixinMiniProgramLogin,
  weixinLogout,
  hasWechatInstall
}