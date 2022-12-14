import { crypto, file } from '@/utils/index'

export {}

Page({
  data: {
    pic: '',
    decrypt_pic: '',
    size: 0,
    encode_size: '0'
  },
  onShow() {

  },
  choosePic(){
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: ({tempFiles:[file]}) =>{
        this.setData({
          pic: file.tempFilePath,
          size: file.size
        })
      }
    })
  },
  lookDetail(){
    wx.getFileSystemManager().readFile({
      filePath: this.data.pic,
      success: res=>{
        console.log(res);
      }
    })
  },
  async goEncode(){
    const key = '123456'
    console.time('加密用时')
    const data = wx.getFileSystemManager().readFileSync(this.data.pic,'hex')
    console.log(data);
    const encryptedData = await crypto.encryptFile(data, key)
    console.log('加密数据长度:',encryptedData,encryptedData.length);
    console.timeEnd('加密用时')

    const saveTempFile = await file.getFilePath({dir:'temp', name: '111'})
    await file.writeFile(saveTempFile, encryptedData, 'hex')

    wx.getFileSystemManager().getFileInfo({
      filePath: saveTempFile,
      success: res=>{
        console.log('加密数据保存文档信息：',res)
      }
    })

    const readData = wx.getFileSystemManager().readFileSync(saveTempFile,'hex')
    console.log("读取加密文件数据：", readData)
    console.time('解密用时')
    const imageHexData = await crypto.decryptFile(readData, key)
    console.timeEnd('解密用时')

    const imageTempFile = await file.getFilePath({dir:'temp', name: '111'})
    await file.writeFile(imageTempFile, imageHexData, 'hex')

    this.setData({
      encode_size: `${encryptedData.length - 48}  salt: 8 `,
      decrypt_pic: imageTempFile
    })
  }
})