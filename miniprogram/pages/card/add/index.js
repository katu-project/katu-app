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
    if(this.hasEmptyPic()) {
      wx.showToast({
        title: '有未使用的卡面',
        icon: 'error'
      })
      return
    }
    wx.showLoading({
      title: '保存中',
      mask: true
    })
    
    try {
      await this.saveCard()
      wx.nextTick(this.saveDone)
    } catch (error) {
      console.log(error);
      wx.nextTick(()=>{
        this.saveFailed(error)
      })
    } finally {
      await wx.hideLoading()
    }
  },

  async saveCard(){
    const card = Object.assign({},this.data.card)
    const cardManager = await getCardManager()
    return cardManager.add(card)
  },
  async saveDone(){
    await wx.hideLoading()
    wx.showModal({
      title: '操作成功',
      content: '卡片数据已保存',
      showCancel: false,
      success: ()=>{
        wx.navigateBack()
      }
    })
  },
  async saveFailed(error){
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
          this.app.setMasterKey(content)
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
    } catch (error) {
      wx.showToast({
        title: error.message,
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