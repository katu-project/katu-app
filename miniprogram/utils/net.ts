import { sleep, toPromise } from './base'
import { getCache } from './cache'
import file from './file'

class CustomError extends Error {
  constructor(message, cause?) {
    super(message);
    this.cause = cause;
    this.name = 'CustomError';
  }
}

async function httpRequest(url:string, data, options:Omit<WechatMiniprogram.RequestOption,'url'>){
  const request = args => wx.request(args)
  request.noLog = true
  const args:WechatMiniprogram.RequestOption = {
    url,
    data,
    ...options
  }
  return toPromise(request, args)
}

async function httpPutRequest(url:string, data, options:Omit<WechatMiniprogram.RequestOption,'url'|'method'>){
  return httpRequest(url, data, {
    method: 'PUT',
    ...options
  })
}

async function request(action:string, data:any, requestor, options){
  const error = {
    code: 0,
    message: ''
  }

  const networkTimeout = new Promise(async (_,reject)=>{
    await sleep(9000)
    reject({
      message: '请求超时，请检查网络'
    })
  })
  
  let resp

  try {
    resp = await Promise.race([
      requestor(action, data, options),
      networkTimeout
    ])
  } catch (err:any) {
    error.message = err.message || err.errMsg || err.toString()
    error.code = 600 // 云函数报错
    console.error('网络请求错误：',action,data,error)
    throw error
  }

  if(typeof resp !== 'object'){
    error.message = '基础请求响应错误: '+ JSON.stringify(resp)
    error.code = 500 // 1 业务报错 其他 系统错误
    console.error(action, error)
    throw error
  }

  if(resp.code !== 0){
    error.message = resp.msg
    error.code = resp.code // 1 业务报错 其他 系统错误
    if(resp.code != 1) console.error(action, error)
    throw error
  }

  return resp.data
}

export async function downloadFile(url:string, options:{savePath:string, header?:IAnyObject}){
  const download = args => wx.downloadFile(args)
  try {
    const args: WechatMiniprogram.DownloadFileOption = {
      url
    }
    if(options.header) {
      args.header = options.header
    }
    const res:WechatMiniprogram.DownloadFileSuccessCallbackResult = await toPromise(download, args)
    if (res.statusCode !== 200) {
      throw new CustomError(`文件下载出错[${res.statusCode}]`)
    }
    if (!res.tempFilePath) {
      throw new CustomError("文件下载出错[104]")
    }
    await file.saveTempFile(res.tempFilePath, options.savePath)
    return res
  } catch (error) {
    console.error(error)
    if(error instanceof CustomError){
      throw error
    }
    throw Error("文件下载出错[100]")
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
  const request = async (url:string, data?:any, reqOptions?:AnyObject) => {
    const args:WechatMiniprogram.RequestOption = {
      url: `${options.api}/${url}`,
      data,
      header: {
        Token: options.token || '',
        'x-origin': 'http'
      },
      timeout: 10000,
      method: reqOptions?.method || 'POST'
    }

    // #if NATIVE
    if(!args.header?.Token){ // 内置 Token 优先
      const token = await getCache<string>('KATU_APP_TOKEN').catch(console.debug)
      args.header!.Token = token || ''
    }
    // #endif
    return toPromise(apiReq, args, 'data')
  }
  return request
}

function createHttpUploader(options:IHttpRequestOptions){ 
  return async ({url, options:{filePath, uploadInfo}}) => {
    const upload = args => wx.uploadFile(args)
    let resp,respJson

    const args = {
      filePath,
      url: `${options.api}/${url}`,
      formData: uploadInfo,
      header: {
        Token: options.token,
        'x-origin': 'http'
      },
      name: 'file'
    }

    // #if NATIVE
    if(!args.header?.Token){ // 内置 Token 优先
      const token = await getCache<string>('KATU_APP_TOKEN').catch(console.debug)
      args.header!.Token = token || ''
    }
    // #endif

    try {
      resp = await toPromise<string>(upload, args)
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
      throw Error(`上传出错了[${resp.statusCode}]`)
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

export function createCosUploader(){
  return async (filePath:string, options) => {
    let uploader:()=>any

    if(options.method === 'PUT'){
      uploader = async ()=>{
        const fileBinary = await file.readFile(filePath)
        return httpPutRequest(options.url, fileBinary, {
          header: {
            'content-type': 'application/octet-stream'
          }
        })
      }
    }else{
      const upload = args => wx.uploadFile(args)
      const args = {
        url: options.url,
        filePath,
        formData: options.formData,
        name: 'file'
      }
      uploader = async ()=>{
        return toPromise<string>(upload, args)
      }
    }
    let resp

    try {
      resp = await uploader()
    } catch (error:any) {
      console.error('cos upload err:',error)
      if(error.errMsg){
        throw Error('上传出错了[021]')
      }
      throw error
    }

    if(resp.statusCode !== 200){
      console.error('cos upload resp err:',resp)
      if(resp.statusCode === 413){
        throw Error(`选择的文件太大了，无法上传`)
      }
      throw Error(`上传出错了[${resp.statusCode}]`)
    }
    return resp.data
  }
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
    requestor = createHttpRequestor(config.http!)
    uploader = createHttpUploader(config.http!)
  }

  return {
    cosUpload: createCosUploader(),
    request: <R = void>(url:string, data?, options?):Promise<R> => request(url,data||{},requestor, options),
    upload: (url:string, options):Promise<string> => uploader({url, options}),
    download: downloadFile
  }
}