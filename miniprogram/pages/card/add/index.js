const { getUser,saveCard, getCard } = require('../../../api')
const { getCardManager } = require('../../../class/cardManager')
Page({
  data: {
    card0: '',
    card1: '',
    card: {
      id: '',
      pics: {}
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if(options.id){
      this.data.card.id = options.id
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    if(this.data.card.id){
      wx.showLoading({
        title: 'load card'
      })
      getCard({
        id: this.data.card.id
      }).then(res=>{
        this.setData({
          'card.pics': res.pics,
          card0: res.pics.pic0,
          card1: res.pics.pic1
        })
      }).finally(wx.hideLoading)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  async goSaveCard(){
    wx.showLoading({
      title: '上传中'
    })
    this.saveCard()
    .then(res=>{
      wx.showToast({
        title: 'ok',
      })
    }).catch(({message})=>{
      wx.showToast({
        title: message || 'savePic ERROR',
      })
    }).finally(wx.hideLoading)
  },
  async saveCard(){
    const {openid} = await getUser()
    const card = this.data.card
    card.pics.pic0 = await this.uploadFile(this.data.card0,`${openid}/${this.data.card0.slice(-32)}`)
    card.pics.pic1 = await this.uploadFile(this.data.card1,`${openid}/${this.data.card1.slice(-32)}`)
    return saveCard(card)
  },
  async uploadFile(tempFilePath, saveName){
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: saveName,
      filePath: tempFilePath
    })
    return fileID
  },
  async goTakePic(){
    try {
      const picPath = await this.takePic()
      const card = {}
      if(this.data.card0){
        card.card1 = picPath
      }else{
        card.card0 = picPath
      }
      this.setData(card)
    } catch (error) {
      console.log(error);
      wx.showToast({
        title: error.message || error,
      })
    }
  },
  async goEncryptCard(){
    // if(!this.data.card0 || !this.data.card1) return
    console.log(this.data)
    try {
      const cardManager = await getCardManager()
      const res = await cardManager.encryptImage(this.data.card0)
      console.log(res);
      const deRes = await cardManager.decryptImage(res.imagePath, res.imageSecretKey)
      // console.log(deRes);
      this.setData({
        // pic1: deRes.imagePath
      })
    } catch (error) {
      console.log(error);
    }
  },
  async takePic(){
    const pics = await wx.chooseMedia({
      count: 1,
      mediaType: 'image'
    })

    if(!pics.tempFiles.length) return
    const tempFile = pics.tempFiles[0]
    return tempFile.tempFilePath
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