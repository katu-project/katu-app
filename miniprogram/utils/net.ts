import { toPromise } from './base'

export const request = <T>(action: string, data={}): Promise<T> => {
  const error = {
    code: 0,
    message: ''
  }
  return new Promise((resolve,reject)=>{
    const wxLog = wx.getLogManager({level:1})
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(({result})=>{
      if(typeof result !== 'object'){
        error.message = '基础请求响应错误: '+ JSON.stringify(result)
        error.code = 500 // 1 业务报错 其他 系统错误
        wxLog.debug(error)
        return reject(error)
      }
      if(result.code === 0){
        resolve(result.data)
      }else{
        error.message = result.msg
        error.code = result.code // 1 业务报错 其他 系统错误
        if(result.code != 1) wxLog.debug(error)
        reject(error)
      }
    })
    .catch(err=>{
      error.message = err.message
      error.code = 600 // 云函数报错
      wxLog.debug(error)
      reject(error)
    })
  })
}

export async function download(url, filePath){
  const download = args => wx.downloadFile(args)
  return toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
    url,
    filePath
  })
}

export default {
  download,
  request
}