import { toPromise } from './base'
import { getCache } from './cache'
import file from './file'

async function request<T>(action: string, data:any, requestor): Promise<T>{
  const error = {
    code: 0,
    message: ''
  }
  const wxLog = wx.getLogManager({level:1})

  let resp

  try {
    resp = await requestor(action, data)
  } catch (err:any) {
    error.message = err.message || err.errMsg || err.toString()
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

async function downloadCloudFile(url:string, savePath:string){
  try {
    const { tempFilePath } = await wx.cloud.downloadFile({ fileID: url })
    await file.saveTempFile(tempFilePath, savePath)
  } catch (error: any) {
    console.error('download Cloud File Error:', error)
    throw Error('文件下载出错[033]')
  }
}

async function uploadCloudFile({options:{filePath, uploadInfo}}){
  const {fileID} = await wx.cloud.uploadFile({
    cloudPath: uploadInfo.cloudPath,
    filePath
  })
  return fileID
}

function createCloudRequestor(options:ICloudRequestOptions){
  const request = async (url:string, data?:any)=>{
    const {result} = await wx.cloud.callFunction({ 
                    name: options.apiName,
                    data: { action:url, data }
                })
    return result
  }
  return request
}

function createHttpRequestor(options:IHttpRequestOptions){
  const apiReq = args => wx.request(args)
  apiReq.noLog = true
  const request = async (url:string, data?:any) => {
    const args:WechatMiniprogram.RequestOption = {
      url: `${options.api}/${url}`,
      data,
      header: {
        Token: options.token || '',
        origin: 'http'
      },
      timeout: 10000,
      method: 'POST'
    }

    // #if NATIVE
    const token = await getCache<string>('KATU_APP_TOKEN').catch(console.debug)
    args.header!.Token = token || ''
    // #endif
    return toPromise(apiReq, args, 'data')
  }
  return request
}

function createHttpUploader(options:IHttpRequestOptions){ 
  return async ({url, options:{filePath, uploadInfo}}) => {
    const upload = args => wx.uploadFile(args)
    let resp,respJson
    try {
      resp = await toPromise<string>(upload, {
        filePath,
        url: `${options.api}/${url}`,
        formData: uploadInfo,
        header: {
          Token: options.token
        },
        name: 'file'
      })
    } catch (error:any) {
      if(error.errMsg){
        console.error(error)
        throw Error('上传出错了[021]')
      }
      throw error
    }
    if(resp.statusCode !== 200){
      if(resp.statusCode === 413){
        throw Error(`选择的文件太大了，无法上传`)
      }
      throw Error(`上传出错了[N${resp.statusCode}]`)
    }

    try {
      respJson = JSON.parse(resp.data)
    } catch (error) {
      console.error(resp.data)
      throw Error('上传出错了[022]')
    }
    if(respJson.code !== 0){
      throw Error(`上传出错了[P${respJson.code}]`)
    }
    if(!respJson.data){
      throw Error('上传出错了[023]')
    }
    return respJson.data
  }
}

function createHttpDownloader(options:IHttpRequestOptions){ 
  return async ({url, options:{url:fileId, savePath}}) => {
    const download = args => wx.downloadFile(args)
    let res
    try {
      res = await toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
        url: `${options.api}/${url}?url=${fileId}`,
        filePath: savePath,
        header: {
          Token: options.token
        },
      })
    } catch (error) {
      console.error(error)
      throw Error("文件下载出错[031]")
    }
    if (res.statusCode !== 200) {
      throw Error(`文件下载出错[${res.statusCode}]`)
    }
    if (!res.filePath) {
      throw Error("文件下载出错[032]")
    }
  }
}

export function createRequest(config){
  let requestor, uploader, downloader

  // #if NATIVE
  config.type = 'http'
  config.http.token = ''
  // #endif

  if(config.type === 'cloud'){
    wx.cloud.init({
      env: config.cloud!.env,
      traceUser: true,
    })
    requestor = createCloudRequestor(config.cloud!)
    uploader = uploadCloudFile
    downloader = ({options})=> downloadCloudFile(options.url, options.savePath)
  }else{
    requestor = createHttpRequestor(config.http!)
    uploader = createHttpUploader(config.http!)
    downloader = createHttpDownloader(config.http!)
  }

  return {
    request: <T,K extends IAnyObject = IAnyObject>(url:string,data?:K) => request<T>(url,data||{},requestor),
    upload: (url:string, options):Promise<string> => uploader({url, options}),
    download: (url:string, options):Promise<void> => downloader({url, options})
  }
}