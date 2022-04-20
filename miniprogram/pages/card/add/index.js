const { getUser,saveCard, getCard } = require('../../../api')
const { getCardManager } = require('../../../class/cardManager')
Page({
  data: {
    pic0: '',
    pic1: '',
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
          pic0: res.pics.pic0,
          pic1: res.pics.pic1
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
    if(!this.data.pic0 || !this.data.pic1) return
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
    card.pics.pic0 = await this.uploadFile(this.data.pic0,`${openid}/${this.data.pic0.slice(-32)}`)
    card.pics.pic1 = await this.uploadFile(this.data.pic1,`${openid}/${this.data.pic1.slice(-32)}`)
    return saveCard(card)
  },
  async uploadFile(tempFilePath, saveName){
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: saveName,
      filePath: tempFilePath
    })
    return fileID
  },
  async goTapPic(){
    if(this.data.pic0 && this.data.pic1){
      wx.previewImage({
        urls: [this.data.pic0,this.data.pic1],
      })
      return
    }
    try {
      const picPath = await this.takePic()
      const card = {}
      if(this.data.pic0){
        card.pic1 = picPath
      }else{
        card.pic0 = picPath
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
    if(!this.data.pic0 || !this.data.pic1) return
    console.log(this.data)
    wx.showLoading({
      title: '加密中'
    })
    try {
      const cardManager = await getCardManager()
      const {openid} = await getUser()
      const card = this.data.card
      card.encrypted = 1
      console.time()
      card.pics.pic0 = await cardManager.encryptImage(this.data.pic0)
      card.pics.pic1 = await cardManager.encryptImage(this.data.pic1)
      card.pics.pic0.url = await this.uploadFile(card.pics.pic0.imagePath, `${openid}/${this.data.pic0.slice(-32)}`)
      card.pics.pic1.url = await this.uploadFile(card.pics.pic1.imagePath, `${openid}/${this.data.pic1.slice(-32)}`)
      console.timeEnd()
      await saveCard(card)
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading({
        success: (res) => {
          wx.showToast({
            title: error.message,
            icon: 'error'
          })
        },
      })
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