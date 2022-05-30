const { getCard, deleteCard } = require('../../../api')
const { getCardManager } = require('../../../class/card')

const DefaultLockImage = '/static/images/lock.svg'
const DefaultShowImage = '/static/images/image.svg'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    defaultLockImage: DefaultLockImage,
    card: {
      _id: '',
      image: [
        {
          url: DefaultShowImage
        }
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if(options.id){
      this.id = options.id
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    if(this.id){
      const res = await getCard({
        _id: this.id
      })
      this.setData({
        'card._id': res._id,
        'card.encrypted': res.encrypted,
        'card.image': res.image.map(pic=>{
          pic._url = pic.url
          if(res.encrypted) pic._url = DefaultLockImage
          return pic
        })
      })
    }
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
    const image = this.data.card.image[idx]
    if(this.data.card.encrypted && image._url === DefaultLockImage){
      const cardManager = await getCardManager()
      const {imagePath} = await cardManager.decryptImage(image)
      this.setData({
        [`card.image[${idx}]._url`]: imagePath
      })
      return
    }
    wx.previewImage({
      urls: this.data.card.image.filter(e=>e._url !== DefaultLockImage).map(e=>e._url)
    })
  },
  goUpdateCard(){
    wx.redirectTo({
      url: '/pages/card/edit/index?id='+ this.id,
    })
  },
  goDeleteCard(){
    wx.showModal({
      title: "确认删除卡片",
      content: "卡片删除后不可恢复！",
      success: ({cancel})=>{
        if(cancel) return
        deleteCard({
          _id: this.id
        }).then(res=>{
          wx.navigateBack()
        })
      }
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