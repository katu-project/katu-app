async function readFile(file){
  return new Promise((resolve,reject)=>{
    wx.getFileSystemManager().readFile({
      filePath: file,
      success: res=>{
        console.log('readFile:',res);
        resolve(res.data)
      },
      fail: error=> reject,
    })
  })
}

module.exports = {
  readFile
}