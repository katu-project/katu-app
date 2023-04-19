import { toPromise } from './base'

export async function deleteFile(filePath){
  const deleteFile = args => wx.getFileSystemManager().unlink(args)
  deleteFile.noLog = true
  const options = {filePath}
  return toPromise<void>(deleteFile, options)
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

export async function copyFile(srcPath, destPath){
  const copyFile = args => wx.getFileSystemManager().copyFile(args)
  const options = {
    srcPath,
    destPath
  }
  return toPromise(copyFile, options)
}

export async function moveFile(oldPath, newPath){
  const moveFile = args => wx.getFileSystemManager().rename(args)
  const options = {
    oldPath,
    newPath
  }
  return toPromise(moveFile, options)
}

export async function checkAccess(path: string) {
  const checkAccess = args => wx.getFileSystemManager().access(args)
  checkAccess.noLog = true
  const options = {path}
  try {
    return await toPromise(checkAccess, options)
  } catch (error:any) {
    throw Error(error?.errMsg || '文件不存在')
  }
}

export async function mkdir(dirPath, recursive?:boolean) {
  const mkdir = args => wx.getFileSystemManager().mkdir(args)
  const options = {dirPath, recursive: true}
  if(recursive) options.recursive = recursive
  return toPromise(mkdir, options)
}

export async function getSavedFileList(){
  const getSavedFileList = (...args) => wx.getFileSystemManager().getSavedFileList(...args)
  return toPromise(getSavedFileList, {}, 'fileList')
}

export async function getStats<T = any>(path, recursive=false){
  const getStats = args => wx.getFileSystemManager().stat(args)
  getStats.noLog = true
  return toPromise<T>(getStats, {
    path,
    recursive
  }, 'stats')
}

export async function readdir(dirPath){
  const readdir = args => wx.getFileSystemManager().readdir(args)
  return toPromise<string[]>(readdir, {
    dirPath
  }, 'files')
}

export async function rmdir(dirPath, recursive=false){
  const rmdir = args => wx.getFileSystemManager().rmdir(args)
  return toPromise(rmdir, {
    dirPath,
    recursive
  })
}
// ------- wx function end ----

// ------- 扩展方法 ----
export async function advReaddir(dir:string){
  return getStats<{path:string,stats:WechatMiniprogram.Stats}[]>(dir,true)
}

export async function getFilePath({dir, name, suffix}:{dir: string, name:string, suffix?:string}){
  let dirPath = dir
  let fileName = name

  if(name.includes('/')){
    const splitName = name.split('/')
    if(splitName.length !== 2){
      throw Error('目录层级过深')
    }

    dirPath = `${dir}/${splitName[0]}`
    fileName = splitName[1]
  }


  try {
    await checkAccess(dirPath)
  } catch (error) {
    await mkdir(dirPath)
  }

  let filePath = `${dirPath}/${fileName}`
  if(suffix){
    filePath += `.${suffix}`
  }
  return filePath
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

export async function getImageData(url){
  const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
  const image = offscreenCanvas.createImage()
  await new Promise(function (resolve, reject) {
    image.onload = resolve
    image.onerror = reject
    image.src = url
  })
  offscreenCanvas.width = image.width;
  offscreenCanvas.height = image.height;
  const ctx = offscreenCanvas.getContext('2d')
  ctx.drawImage(image, 0, 0, image.width, image.height)
  return ctx.getImageData(0, 0, image.width, image.height)
}

export default {
  readFile,
  deleteFile,
  writeFile,
  copyFile,
  moveFile,
  checkAccess,
  getStats,
  readdir,
  rmdir,
  advReaddir,
  getSavedFileList,
  getFilePath,
  getImageType,
  getImageData
}