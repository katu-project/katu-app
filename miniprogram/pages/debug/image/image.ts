const globalData = getApp().globalData
const { crypto: {encryptFile, decryptFile}, file: {getTempFilePath, writeFile} } = globalData.utils
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pic: '',
    decrypt_pic: '',
    size: '0',
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
    const encryptedData = await encryptFile(data, key)
    console.log('加密数据长度:',encryptedData,encryptedData.length);
    console.timeEnd('加密用时')

    const saveTempFile = await getTempFilePath('111')
    await writeFile(saveTempFile, encryptedData, 'hex')

    wx.getFileSystemManager().getFileInfo({
      filePath: saveTempFile,
      success: res=>{
        console.log('加密数据保存文档信息：',res)
      }
    })

    const readData = wx.getFileSystemManager().readFileSync(saveTempFile,'hex')
    console.log("读取加密文件数据：", readData);
    console.time('解密用时')
    const imageHexData = await decryptFile(readData, key)
    console.timeEnd('解密用时')

    const imageTempFile = await getTempFilePath('123')
    await writeFile(imageTempFile, imageHexData, 'hex')

    this.setData({
      encode_size: `${encryptedData.length - 48}  salt: 8 `,
      decrypt_pic: imageTempFile
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})