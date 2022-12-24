export const toPromise = <T>(func, options={}, returnKey?:string): Promise<T> => {
  return new Promise((resolve,reject)=>{
    func({
      ...options,
      success: res=>{
        if(['checkAccess','getStats'].includes(func.name)){

        }else{
          if(res.data && res.data.length > 200){
            console.warn(`${func.name}:`, res.data.slice(-200))
          }else{
            console.warn(`${func.name}:`, res);
          }
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

export async function deleteFile(filePath){
  const deleteFile = args => wx.getFileSystemManager().unlink(args)
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

export async function checkAccess(path: string) {
  const checkAccess = args => wx.getFileSystemManager().access(args)
  const options = {path}
  return toPromise(checkAccess, options)
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

export async function getStats<T = any>(path, recursive=false){
  const getStats = args => wx.getFileSystemManager().stat(args)
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

export async function download(url, filePath){
  const download = args => wx.downloadFile(args)
  return toPromise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(download, {
    url,
    filePath
  })
}
// ------- wx function end ----

// ------- 扩展方法 ----
export async function advReaddir(dir:string){
  return getStats<{path:string,stats:WechatMiniprogram.Stats}[]>(dir,true)
}

export async function getFilePath({dir, name, suffix}:{dir: string, name:string, suffix?:string}){
  let filePath = ''
  try {
    await checkAccess(dir)
  } catch (error) {
    await mkdir(dir)
  }

  filePath = `${dir}/${name}`
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

export default {
  readFile,
  deleteFile,
  writeFile,
  readDir,
  checkAccess,
  getStats,
  readdir,
  advReaddir,
  download,
  getSavedFileList,
  getFilePath,
  getImageType
}