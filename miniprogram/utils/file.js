const CryptoJS = require('crypto-js')
const {APP_TEMP_DIR} = require('../const')

const toPromise = (func, options={}, returnKey) => {
  return new Promise((resolve,reject)=>{
    func({
      ...options,
      success: res=>{
        console.log(`${func.name}:`,res);
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

async function readFile(filePath, encoding){
  const readFile = (...args) => wx.getFileSystemManager().readFile(...args)
  const options = {filePath}
  if(encoding) options.encoding = encoding
  return toPromise(readFile, options , 'data')
}

async function writeFile(filePath, fileData, encoding){
  const writeFile = (...args) => wx.getFileSystemManager().writeFile(...args)
  const options = {
    filePath,
    data: fileData
  }
  if(encoding) options.encoding = encoding
  return toPromise(writeFile, options)
}

async function checkAccess(path) {
  const access = (...args) => wx.getFileSystemManager().access(...args)
  const options = {path}
  return toPromise(access, options)
}

async function mkdir(dirPath, recursive) {
  const mkdir = (...args) => wx.getFileSystemManager().mkdir(...args)
  const options = {dirPath, recursive: true}
  if(recursive) options.recursive = recursive
  return toPromise(mkdir, options)
}

async function readDir(dirPath){
  const readDir = (...args) => wx.getFileSystemManager().readdir(...args)
  return toPromise(readDir, {
    dirPath
  }, 'files')
}

async function getSavedFileList(){
  const getSavedFileList = (...args) => wx.getFileSystemManager().getSavedFileList(...args)
  return toPromise(getSavedFileList, {}, 'fileList')
}

async function getStats(path, recursive=false){
  const getStats = args => wx.getFileSystemManager().stat(args)
  return toPromise(getStats, {
    path,
    recursive
  }, 'stats')
}

async function download(url, filePath){
  const download = args => wx.downloadFile(args)
  return toPromise(download, {
    url,
    filePath
  })
}
// ------- wx function end----
async function getTempFilePath(cacheId, suffix=''){
  let tempFile = ''
  try {
    await checkAccess(APP_TEMP_DIR)
  } catch (error) {
    await mkdir(APP_TEMP_DIR)
  }

  if(cacheId){
    tempFile = `${APP_TEMP_DIR}/${CryptoJS.MD5(cacheId)}`
  }else{
    tempFile = `${APP_TEMP_DIR}/${CryptoJS.lib.WordArray.random(128 / 8)}`
  }

  if(suffix){
    tempFile += `.${suffix}`
  }

  return tempFile
}

module.exports = {
  readFile,
  writeFile,
  readDir,
  checkAccess,
  getStats,
  download,
  getSavedFileList,
  getTempFilePath
}