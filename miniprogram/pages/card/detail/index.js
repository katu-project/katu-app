const { getCard, deleteCard } = require('../../../api')
const { getCardManager } = require('../../../class/card')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    image: [
      {
        _url: '/static/images/image.svg'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if(options.id){
      getCard({
        id: options.id
      }).then(res=>{
        console.log(res);
        this.setData({
          id: res._id,
          encrypted: res.encrypted,
          image: res.image.map(card => ({
            _url: res.encrypted? '/static/images/lock.svg' : card.url,
            url: card.url,
            salt: res.encrypted ? card.salt : ''
          }))
        })
      })
    }
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
  async goTapPic(e){
    const idx = e.currentTarget.dataset.index
    const image = this.data.image[idx]
    if(this.data.encrypted && image._url.endsWith('lock.svg')){
      const cardManager = await getCardManager()
      const {imagePath} = await cardManager.decryptImage(image)
      this.setData({
        [`image[${idx}]._url`]: imagePath
      })
      return
    }
    
    wx.previewImage({
      urls: this.data.image.map(e=>e._url)
    })
  },
  goUpdateCard(){
    wx.navigateTo({
      url: '/pages/card/add/index?id='+ this.data.id,
    })
  },
  goDeleteCard(){
    deleteCard({
      id: this.data.id
    }).then(res=>{
      wx.navigateBack()
    })
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