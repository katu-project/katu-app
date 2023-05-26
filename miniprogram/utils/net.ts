import { toPromise } from './base'

const createCommonRequestor = (options:ICommonRequestOptions) => {
  const apiReq = args => wx.request(args)
  apiReq.noLog = true
  const request = (url:string, data?:any) => {
    return toPromise(apiReq, {
      url: `${options.baseUrl}/${url}`,
      data,
      method: options.method || 'POST'
    }, 'data')
  }
  return request
}

const createCloudRequestor = (options:ICloudRequestOptions) => {
  const request = async (url:string, data?:any)=>{
    const {result} = await wx.cloud.callFunction({ 
                    name: options.apiName,
                    data: { action:url, data }
                })
    return result
  }
  return request
}

const request = async <T>(action: string, data:any, requestor): Promise<T> => {
  const error = {
    code: 0,
    message: ''
  }
  const wxLog = wx.getLogManager({level:1})

  let resp

  try {
    resp = await requestor(action, data)
  } catch (err:any) {
    error.message = err.message
    error.code = 600 // 云函数报错
    wxLog.debug(error)
    throw error
  }

  if(typeof resp !== 'object'){
    error.message = '基础请求响应错误: '+ JSON.stringify(resp)
    error.code = 500 // 1 业务报错 其他 系统错误
    wxLog.debug(error)
    throw error
  }

  if(resp.code !== 0){
    error.message = resp.msg
    error.code = resp.code // 1 业务报错 其他 系统错误
    if(resp.code != 1) wxLog.debug(error)
    throw error
  }

  return resp.data
}

export async function download(url, filePath){
  const download = args => wx.downloadFile(args)
  return toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
    url,
    filePath
  })
}

export async function upload(url:string, {filePath, key}){
  const upload = args => wx.uploadFile(args)
  return toPromise<string>(upload, {
    filePath,
    url,
    key: key || 'file'
  }, 'data')
}

export async function uploadCloudFile({filePath, cloudPath}){
  const {fileID} = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  })
  return fileID
}

export function createRequest(config:IRequestConfig){
  let requestor
  if(config.type === 'cloud'){
    wx.cloud.init({
      env: config.cloud!.env,
      traceUser: true,
    })
    requestor = createCloudRequestor(config.cloud!)
  }else{
    requestor = createCommonRequestor(config.common!)
  }

  return <T,K extends IAnyObject = IAnyObject>(url:string,data?:K) => request<T>(url,data||{},requestor)
}

export function createUploadRequest(config:IRequestConfig){
  return function(url, data?:any){
    if(config.type === 'cloud'){
      return uploadCloudFile(data)
    }else{
      return upload(url, data)
    }
  }
}

export function createBaseRequest(config:IRequestConfig){
  const request = createRequest(config)
  const upload = createUploadRequest(config)
  return {request, upload}
}

export default {
  download
}