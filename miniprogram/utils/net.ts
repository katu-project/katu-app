import { toPromise } from './base'
import file from './file'

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

export async function downloadCloudFile(url:string, savePath:string){
  try {
    const { tempFilePath } = await wx.cloud.downloadFile({ fileID: url })
    await file.saveTempFile(tempFilePath, savePath)
  } catch (error: any) {
    console.error('download Cloud File Error:', error)
    throw Error('文件下载失败')
  }
}

export async function download(url:string, savePath:string){
  const download = args => wx.downloadFile(args)
  const { statusCode, filePath } = await toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
    url,
    filePath:savePath
  })
  if (statusCode !== 200 || !filePath) {
    throw Error("文件下载出错")
  }
}

function createCommonUploader(options:ICommonRequestOptions){ 
  return async ({url, options:{filePath, uploadInfo}}) => {
    const upload = args => wx.uploadFile(args)
    let resp,respJson
    try {
      resp = await toPromise<string>(upload, {
        filePath,
        url: `${options.baseUrl}/${url}`,
        formData: uploadInfo,
        name: 'file'
      }, 'data')
    } catch (error:any) {
      if(error.errMsg){
        console.error(error)
        throw Error('上传出错了[023]')
      }
      throw error
    }
    try {
      respJson = JSON.parse(resp)
    } catch (error) {
      console.error(error)
      throw Error('上传出错了[022]')
    }
    if(respJson.code !== 0 || !respJson.data){
      throw Error('上传出错了[021]')
    }
    return respJson.data
  }
}

async function uploadCloudFile({options:{filePath, uploadInfo}}){
  const {fileID} = await wx.cloud.uploadFile({
    cloudPath: uploadInfo.cloudPath,
    filePath
  })
  return fileID
}

export function createRequest(config:IRequestConfig){
  let requestor, uploader
  if(config.type === 'cloud'){
    wx.cloud.init({
      env: config.cloud!.env,
      traceUser: true,
    })
    requestor = createCloudRequestor(config.cloud!)
    uploader = uploadCloudFile
  }else{
    requestor = createCommonRequestor(config.common!)
    uploader = createCommonUploader(config.common!)
  }

  return {
    request: <T,K extends IAnyObject = IAnyObject>(url:string,data?:K) => request<T>(url,data||{},requestor),
    upload: (url:string, options):Promise<string> => uploader({url, options})
  }
}

export default {
  download,
  downloadCloudFile
}