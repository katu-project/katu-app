import { toPromise } from './base'

export async function deleteFile(filePath){
  const deleteFile = args => wx.getFileSystemManager().unlink(args)
  deleteFile.noLog = true
  const options = {filePath}
  return toPromise<void>(deleteFile, options)
}

export async function readFile<T extends string | ArrayBuffer>(filePath:string, encoding?:string){
  const readFile = args => wx.getFileSystemManager().readFile(args)
  readFile.noLog = true
  const options = {filePath}
  if(encoding) options['encoding'] = encoding
  return toPromise<T>(readFile, options , 'data')
}

export async function getFileInfo(filePath){
  const getFileInfo = args => wx.getFileSystemManager().getFileInfo(args)
  getFileInfo.noLog = true
  const options = {filePath}
  return toPromise<{size:number}>(getFileInfo, options)
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

export async function saveTempFile(tempFilePath:string, filePath:string){
  const saveTempFile = args => wx.getFileSystemManager().saveFile(args)
  const options = {
    tempFilePath,
    filePath
  }
  return toPromise(saveTempFile, options)
}

export async function checkAccess(path: string) {
  const checkAccess = args => wx.getFileSystemManager().access(args)
  checkAccess.noLog = true
  const options = {path}
  try {
    return await toPromise(checkAccess, options)
  } catch (error:any) {
    throw Error(error?.errMsg || 'Access Error')
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

/**
 * Do not use directly
 * bug: When an empty directory is passed in and recursive is true, the result is incorrect
 * @param path 
 * @param recursive 
 * @returns 
 */
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

export async function rmdir(dirPath){
  const _rmdir = args => wx.getFileSystemManager().rmdir(args)
  const items = await advReaddir(dirPath)
  console.log(dirPath,items)
  const files = items.filter(e=>e.stats.isFile())
  const dirs = items.filter(e=>e.stats.isDirectory()).sort((a,b)=>b.path.length-a.path.length)

  for (const item of files) {
    const path = `${dirPath}/${item.path}`
    console.debug('delete file:', path)
    await deleteFile(path)
  }

  for (const item of dirs) {
    const path = `${dirPath}/${item.path}`
    console.debug('delete dir:', path)
    await toPromise<any>(_rmdir, {
      dirPath: path
    })
  }
}
// ------- wx function end ----

// ------- Extension methods ----
// fix recursive=true and dir is not empty, return stat not FileStats array
export async function advReaddir(dir:string){
  const checkStat = await getStats(dir)
  if(!checkStat.isDirectory()){
    throw Error(`${dir} is not a directory`)
  }
  const res = await getStats(dir,true)
  if(!Array.isArray(res) && res?.isDirectory()) {
    return []
  }
  return res as {path:string,stats:WechatMiniprogram.Stats}[]
}

export async function readFileByPosition<T extends string | ArrayBuffer>(options: WechatMiniprogram.ReadFileOption){
  const readFileByPosition = args => wx.getFileSystemManager().readFile(args)
  readFileByPosition.noLog = true
  if(options.encoding === 'hex' && options.length){
    if(options.length * 4 % 8 !== 0) throw Error('length must divisible by 8')
    options.length = options.length * 4 / 8
  }
  return toPromise<T>(readFileByPosition, options , 'data')
}

export async function getFileSize(filePath, unit?:string){
  const {size} = await getFileInfo(filePath)
  if(unit === 'hex'){
    return size * 2
  }
  return size
}

export async function getFilePath({dir, name, suffix}:{dir: string, name:string, suffix?:string}){
  let dirPath = dir
  let fileName = name

  if(name.includes('/')){
    const splitName = name.split('/')
    if(splitName.length !== 2){
      throw Error('Directory is too deep')
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
  readFileByPosition,
  deleteFile,
  writeFile,
  copyFile,
  moveFile,
  saveTempFile,
  checkAccess,
  getStats,
  readdir,
  rmdir,
  advReaddir,
  getSavedFileList,
  getFilePath,
  getFileSize,
  getImageType,
  getImageData
}