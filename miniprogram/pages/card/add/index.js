const { getCard } = require('../../../api')
const { getCardManager } = require('../../../class/cardManager')
Page({
  data: {
    pic: [
      {url: '../../../static/images/add.svg'},
      {url: '../../../static/images/add.svg'}
    ],
    encrypted: false,
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
        console.log(res);
      }).finally(wx.hideLoading)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  hasSelectedPic(){
    return this.data.pic.map(e=>e.url.endsWith('add.svg')).filter(e=>e).length === 0
  },
  async goSaveCard(){
    if(!this.hasSelectedPic()) return
    wx.showLoading({
      title: '上传中'
    })
    this.saveCard()
    .then(res=>{
      wx.nextTick(()=>{
        wx.showToast({
          title: 'ok',
        })
      })
    }).catch((error)=>{
      console.log(error);
      wx.nextTick(()=>{
        wx.showToast({
          title: error.message || 'savePic ERROR',
          icon: 'error'
        })
      })
    }).finally(wx.hideLoading)
  },

  async saveCard(){
    const cardManager = await getCardManager()
    return cardManager.save(this.data)
  },
  
  async goTapPic(e){
    const index = e.currentTarget.dataset.index
    try {
      const cardManager = await getCardManager()
      const picPath = await cardManager.choosePic()
      if(!picPath) return
      
      const key = `pic[${index}].url`
      this.setData({
        [key]: picPath
      })
    } catch (error) {
      wx.showToast({
        title: error.message || error.toString(),
        icon: "error"
      })
    }
  },
  keepEncrypt(){
    this.setData({
      encrypted: !this.data.encrypted
    })
  },
  previewPic(){
    wx.previewImage({
      urls: this.data.pic.map(e=>e.url),
    })
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