import { toPromise } from './base'

const request = async <T>(action: string, data={}, {baseUrl,type}): Promise<T> => {
  const error = {
    code: 0,
    message: ''
  }
  const wxLog = wx.getLogManager({level:1})

  let resp

  try {
    if(type === 'api'){
      const apiReq = (args) => wx.request(args)
      apiReq.noLog = true
      resp = await toPromise(apiReq, {
        url: `${baseUrl}/${action}`,
        data,
        method: 'POST'
      }, 'data')
    }else{
      const {result} = await wx.cloud.callFunction({ name: 'api', data: { action, data } })
      resp = result
    }
    
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

  if(resp.code === 0){
    return resp.data
  }else{
    error.message = resp.msg
    error.code = resp.code // 1 业务报错 其他 系统错误
    if(resp.code != 1) wxLog.debug(error)
    throw error
  }
  return resp
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

export function createRequest(config){
  if(config.type === 'wxc'){
    wx.cloud.init({
      env: config.apiBaseUrl,
      traceUser: true,
    })
  }
  return function<T>(url, data?:any){
    return request<T>(url, data, config)
  }
}

export function createUploadRequest(config){
  return function(url, data?:any){
    if(config.type === 'wxc'){
      return uploadCloudFile(data)
    }else{
      return upload(url, data)
    }
  }
}

export default {
  createRequest,
  createUploadRequest,
  download
}