const CryptoJS = require('crypto-js')
import { random } from './crypto'

export const toPromise = <T>(func, options={}, returnKey?:string): Promise<T> => {
  return new Promise((resolve,reject)=>{
    func({
      ...options,
      success: res=>{
        if(res.data && res.data.length > 200){
          console.warn(`${func.name}:`, res.data.slice(-200))
        }else{
          console.warn(`${func.name}:`, res);
        }
        if(returnKey && res.hasOwnProperty(returnKey)){
          resolve(res[returnKey])
        }else{
          resolve(res)
        }
      },
      fail: reject
    })
  })
}

export async function readFile(filePath, encoding){
  const readFile = args => wx.getFileSystemManager().readFile(args)
  const options = {filePath, encoding: 'utf8'}
  if(encoding) options.encoding = encoding
  return toPromise<string | ArrayBuffer>(readFile, options , 'data')
}

export async function writeFile(filePath, fileData, encoding?: string){
  const writeFile = args => wx.getFileSystemManager().writeFile(args)
  const options = {
    filePath,
    encoding: 'utf8',
    data: fileData
  }
  if(encoding) options.encoding = encoding
  return toPromise(writeFile, options)
}

export async function checkAccess(path) {
  const access = args => wx.getFileSystemManager().access(args)
  const options = {path}
  return toPromise(access, options)
}

export async function mkdir(dirPath, recursive?:boolean) {
  const mkdir = args => wx.getFileSystemManager().mkdir(args)
  const options = {dirPath, recursive: true}
  if(recursive) options.recursive = recursive
  return toPromise(mkdir, options)
}

export async function readDir(dirPath){
  const readDir = args => wx.getFileSystemManager().readdir(args)
  return toPromise(readDir, {
    dirPath
  }, 'files')
}

export async function getSavedFileList(){
  const getSavedFileList = (...args) => wx.getFileSystemManager().getSavedFileList(...args)
  return toPromise(getSavedFileList, {}, 'fileList')
}

export async function getStats(path, recursive=false){
  const getStats = args => wx.getFileSystemManager().stat(args)
  return toPromise(getStats, {
    path,
    recursive
  }, 'stats')
}

export async function download(url, filePath){
  const download = args => wx.downloadFile(args)
  return toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
    url,
    filePath
  })
}
// ------- wx function end----
export async function getTempFilePath<T extends {dir: string, cacheId?:string, suffix?:string}>(options?:T){
  const randomFileName = await random(128 / 8)
  let tempFile = randomFileName
  if(options){
    const {dir:tempDir, cacheId, suffix} = options

    try {
      await checkAccess(tempDir)
    } catch (error) {
      await mkdir(tempDir)
    }
  
    if(cacheId){
      tempFile = `${tempDir}/${CryptoJS.MD5(cacheId)}`
    }else{
      tempFile = `${tempDir}/${randomFileName}`
    }

    if(suffix){
      tempFile += `.${suffix}`
    }
  }
  return tempFile
}

export async function getImageType(picPath){
  try {
    const info = await wx.getImageInfo({
      src: picPath,
    })
    return info.type
  } catch (error) {
    console.log('getImageType error :',error);
  }
  return ''
}

export default {
  readFile,
  writeFile,
  readDir,
  checkAccess,
  getStats,
  download,
  getSavedFileList,
  getTempFilePath,
  getImageType
}