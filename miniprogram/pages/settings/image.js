const { crypto: {encryptImage, decryptImage} } = require('../../utils/index')

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
    this.setData({
      encode_size: cryptedFile.length
    })
    // const decryptedFile = await decryptImage(cryptedFile, '1234')
    // console.log(decryptedFile);
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