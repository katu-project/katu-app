const CryptoJS = require('crypto-js')

async function readFile(filePath){
  return new Promise((resolve,reject)=>{
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      success: res=>{
        console.log('readFile:',res);
        resolve(res.data)
      },
      fail: reject
    })
  })
}

async function saveFile(filePath, fileData){
  return new Promise((resolve,reject)=>{
    wx.getFileSystemManager().writeFile({
      filePath: filePath,
      data: fileData,
      success: res=>{
        console.log('saveFile:',res);
        resolve(res.data)
      },
      fail: reject
    })
  })
}

async function checkAccess(path) {
  return new Promise((resolve,reject)=>{
    wx.getFileSystemManager().access({
      path: path,
      success: res=>{
        console.log('checkAccess:',res);
        resolve(res)
      },
      fail: reject
    })
  })
}

async function mkdir(path) {
  return new Promise((resolve,reject)=>{
    wx.getFileSystemManager().mkdir({
      dirPath: path,
      recursive: true,
      success: res=>{
        console.log('mkdir:',res);
        resolve(res)
      },
      fail: reject
    })
  })
}

async function getTempFilePath(cacheId){
  const tempDir = `${wx.env.USER_DATA_PATH}/katu/temp`
  let tempFile = ''
  try {
    await checkAccess(tempDir)
  } catch (error) {
    await mkdir(tempDir)
  }

  if(cacheId){
    tempFile = `${tempDir}/${CryptoJS.MD5(cacheId)}`
  }else{
    tempFile = `${tempDir}/${CryptoJS.lib.WordArray.random(128 / 8)}`
  }

  return tempFile
}

module.exports = {
  readFile,
  saveFile,
  getTempFilePath
}