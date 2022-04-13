const { writeFile } = require('../../utils/file');
const { crypto: {encryptImage, decryptImage}, file: {getTempFilePath} } = require('../../utils/index')

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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  choosePic(){
    wx.chooseMedia({
      count: 1,
      mediaType: 'image',
      success: ({tempFiles:[file]}) =>{
        console.log( file);
        this.setData({
          pic: file.tempFilePath,
          size: file.size
        })
      }
    })
  },
  async goEncode(){
    const cryptedFile = await encryptImage(this.data.pic, '1234')
    const tempFile = await getTempFilePath('111')
    console.log('save encrypted temp file:',tempFile);
    const jsonRes = JSON.parse(cryptedFile)
    console.log('enc size:', jsonRes.ct.length/2);
    await writeFile(tempFile, cryptedFile)
    const imageObj = await decryptImage(tempFile, '1234')
    console.log(imageObj.slice(0,32),imageObj.length);
    const imageTempFile = await getTempFilePath('123')
    console.log('save encrypted temp file:',imageTempFile);
    await writeFile(imageTempFile, imageObj, 'hex')
    
    this.setData({
      encode_size: cryptedFile.length,
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