const { getCardManager } = require('../../../class/card')
const DefaultAddImage = '/static/images/add.svg'
const globalData = getApp().globalData

Page({
  data: {
    card: {
      encrypted: false,
      title: '卡片名称1',
      image: [
        { url: DefaultAddImage }
      ],
    },
    curShowPicIdx: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    this.app = globalData.app
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if(this.resolveImagePath){
      const key = `card.image[${this.resolveImageIdx}].url`
      this.setData({
        [key]: this.resolveImagePath
      })
      this.resolveImagePath = null
      this.resolveImageIdx = 0
    }
  },
  hasEmptyPic(){
    return this.data.card.image.filter(e=>e.url === DefaultAddImage).length > 0
  },
  async goSaveCard(){
    if(this.hasEmptyPic()) return
    wx.showLoading({
      title: '保存中',
      mask: true
    })
    
    try {
      await this.saveCard()
      await wx.showToast({
        title: 'ok',
      })
      wx.navigateBack({
        delta: 0,
      })
    } catch (error) {
      console.log(error);
      await wx.hideLoading()
      if(error.message === '01'){
        wx.showModal({
          title: '未设置主密码',
          content: '需要设置主密码才能启用加密功能',
          confirmText: '去设置',
          success: ({cancel})=>{
            if(cancel) return
            wx.navigateTo({
              url: '../../settings/security/master-key/index',
            })
          }
        })
      }else if(error.message === '02'){
        wx.showModal({
          title: '请输入主密码',
          editable: true,
          success: ({cancel, content}) => {
            if(cancel) return
            if(!content){
              wx.nextTick(()=>{
                wx.showToast({
                  title: '输入不能为空',
                })
              })
              return
            }
            this.app.saveMasterKey(content)
            wx.nextTick(()=>{
              this.goSaveCard()
            })
          }
        })
      }else{
        wx.showModal({
          title: '保存数据出错',
          content: error.message
        })
      }
    }
  },

  async saveCard(){
    let card = this.data.card
    const cardManager = await getCardManager()
    return cardManager.add(card)
  },
  
  async goTapPic(e){
    const index = e.currentTarget.dataset.index
    try {
      const cardManager = await getCardManager()
      const picPath = await cardManager.choosePic()
      if(!picPath) return

      this.resolveImageIdx = index
      wx.navigateTo({
        url: `../image-processor/index?p=${picPath}`,
      })
      // const key = `card.image[${index}].url`
      // this.setData({
      //   [key]: picPath
      // })
    } catch (error) {
      wx.showToast({
        title: error.message || error.toString(),
        icon: "error"
      })
    }
  },
  addCardPic(){
    const idx = this.data.card.image.length
    if(idx == 1){
      this.setData({
        'card.image': this.data.card.image.concat({url: DefaultAddImage})
      })
    }else{
      this.setData({
        curShowPicIdx: 0,
        'card.image': this.data.card.image.slice(0,-1)
      })
    }
  },
  keepEncrypt(){
    this.setData({
      'card.encrypted': !this.data.card.encrypted
    })
  },
  cardSwiper(e){
    if(e.detail.source == 'touch'){
      this.setData({
        curShowPicIdx: e.detail.current
      })
    }

  },
  goEditTitle(){
    this.setData({
      showTextEditor: true
    })
  },
  goChangeTitle(e){
    this.setData({
      'card.title': e.detail.value
    })
  },
  goFinishEditTitle(){
    this.setData({
      editTitle: false
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