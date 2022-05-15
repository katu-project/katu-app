const { writeFile } = require('../../../utils/file');
const { crypto: {encryptImage, decryptImage}, file: {getTempFilePath} } = require('../../../utils/index')

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
        this.setData({
          pic: file.tempFilePath,
          size: file.size
        })
      }
    })
  },
  async goEncode(){
    const key = '123456'
    console.time('加密用时')
    const encryptedJson = await encryptImage(this.data.pic, key)
    console.timeEnd('加密用时')

    const saveTempFile = await getTempFilePath('111')
    await writeFile(saveTempFile, JSON.stringify(encryptedJson))

    console.time('解密用时')
    const imageHexData = await decryptImage(saveTempFile, key)
    console.timeEnd('解密用时')

    const imageTempFile = await getTempFilePath('123')
    await writeFile(imageTempFile, imageHexData, 'hex')
    console.log(encryptedJson);
    this.setData({
      encode_size: `${encryptedJson.ct.length/2}  salt:${encryptedJson.s.length/2}  iv:${encryptedJson.iv.length/2}`,
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