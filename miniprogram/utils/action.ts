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
  const i18n = getApp().i18n
  return new Promise((resolve)=>{
    const params:WechatMiniprogram.ShowModalOption = {
      title,
      content: content || '',
      ...(options || {})
    }
    if(!params.confirmText){
      params.confirmText = i18n.t('confirm')
    }
    if(!params.cancelText){
      params.cancelText = i18n.t('cancel')
    }
    wx.showModal(params).then((e)=>{
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
  const i18n = getApp().i18n
  let loadingTitle = i18n.t('processing') , 
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
          message: i18n.t_e('timeout_retry')
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
      if(Object.hasOwnProperty ? Object.hasOwnProperty.call(error,'code'): error.code){
        if(error.code === 1){
          wx.showModal({
            title: i18n.t_e('operate_error'),
            content: failedContent || error.message.toString() || i18n.t('unknown_error'),
            showCancel: failedNoticeCancel ? true : false,
            cancelText: failedNoticeCancel?.text || i18n.t('cancel'),
            success: res=>{
              if(failedNoticeCancel && res.cancel){
                failedNoticeCancel.action()
              }
            }
          })
          if(returnFailed) return reject(error)
        }else{
          const showContent = `Error: ${error.code}`
          const showModalOption: WechatMiniprogram.ShowModalOption = {
            title: i18n.t_e('service_error'),
            content: `${error.message || i18n.t_e('retry_again')}\n${showContent}`,
            confirmText: i18n.t('get_help',[],'other'),
            cancelText: i18n.t('cancel'),
            showCancel: false,
            success: ({confirm})=>{
              if(!confirm) return
              wx.redirectTo({
                url: '/pages/about/contact/index',
              })
            },
            fail: (e)=>{
              console.error('showModal',e)
              wx.reLaunch({
                url: '/pages/home/index',
              })
            }
          }
          // 400 is about user account 
          if(error.code.toString().startsWith('4')){
            showModalOption.title = i18n.t_e('account_error')
            if(error.code == 401){
              showModalOption.title = i18n.t_e('request_error')
              showModalOption.content = i18n.t_e('login_invalid')
              showModalOption.showCancel = true
              showModalOption.confirmText = i18n.t('go_login')
              showModalOption.success = ({confirm})=>{
                if(!confirm) return
                wx.navigateTo({
                  url: '/pages/auth/index',
                })
              }
            }
          }
          // 500 is about app service
          if(error.code.toString().startsWith('5')){
            showModalOption.title = i18n.t_e('service_error')
            showModalOption.content = i18n.t_e('service_not_work')
            showModalOption.showCancel = true
          }

          // 600 is api request error
          if(error.code.toString().startsWith('6')){
            showModalOption.title = i18n.t_e('network_error')
            showModalOption.content = i18n.t_e('check_net_retry')
            showModalOption.showCancel = true
            showModalOption.confirmText = i18n.t('go_config',[],'other')
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
      }else{ // wx mp error
        if(error.errMsg && ['scanCode:fail cancel'].includes(error.errMsg)){
          wx.showToast({
            title: i18n.t('operate_cancel'),
            icon: 'none'
          })
        }else{
          wx.showModal({
            title: i18n.t_e('operate_error'),
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
  const i18n = getApp().i18n
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
        title: i18n.t('choose_cancel',[],'other'),
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