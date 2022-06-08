const { getCardManager } = require('../../../class/card')

const globalData = getApp().globalData
Page({
  data: {
    tmpImagePath: ''
  },
  onLoad(options) {
    this.setData({
      tmpImagePath: globalData.app.Constant.DefaultShowImage
    })
    this.originImagePath = options.p
  },
  onReady() {
    this.setData({
      tmpImagePath: this.originImagePath
    })
  },
  onShow() {

  },
  goBack(){
    wx.navigateBack({})
  },
  useAndBack() {
    const pages = getCurrentPages()
    const prevPage = pages[pages.length-2]
    prevPage.resolveImagePath = this.data.tmpImagePath
    wx.navigateBack({})
  },
  async selectMethod(e){
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    await this.processImage(parseInt(e.detail.value))
    wx.hideLoading({})
  },
  async processImage(idx){
    try {
      let imageUrl = this.originImagePath
      switch (idx) {
        case 0:
          break;
        case 1:
          break
        case 2:
          {
            const cardManager = await getCardManager()
            imageUrl = await cardManager.parseCardImageByRemoteApi(this.data.tmpImagePath)
          }
          break
        default:
          break;
      }
      
      this.setData({
        'tmpImagePath': imageUrl
      })
    } catch (error) {
      wx.nextTick(()=>{
        wx.showModal({
          title: '解析卡片出错',
          content: error.message
        })
      })
    }

    return new Promise(resolve=>{
      setTimeout(() => {
        resolve()
      }, 1000);
    })
  },
  showTip1(){
    console.log('s');
  },
  showTip2(){

  }
})