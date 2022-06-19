const { getCardManager } = require('../../../class/card')
const { loadData, showChoose } = require('../../../utils/index')
const globalData = getApp().globalData

Page({
  useRemoteApiConfirm: false,
  data: {
    selectedMethod: 0,
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
    return this.processImage(parseInt(e.detail.value))
  },
  async processImage(idx){
    const imageUrl = this.originImagePath
    
    switch (idx) {
      case 0:
        break;
      case 1:
        this.useInternalib()
        break
      case 2:
        this.useRemoteApi()
        break
      default:
        break;
    }

    this.setData({
      'tmpImagePath': imageUrl
    })
  },
  async useInternalib(){
    const cardManager = await getCardManager()
    const imageUrl = await loadData(cardManager.parseCardImageByInternalLib, this.data.tmpImagePath)
    this.setData({
      'tmpImagePath': imageUrl
    })
  },
  async useRemoteApi(){
    const cardManager = await getCardManager()
    if(!this.useRemoteApiConfirm) {
      this.setData({
        selectedMethod: 0
      })
      this.useRemoteApiConfirm = true
      this.showTip2()
      return
    }
    const imageUrl = await loadData(cardManager.parseCardImageByRemoteApi, this.data.tmpImagePath)
    this.setData({
      'tmpImagePath': imageUrl
    })
  },
  showTip1(){
    showChoose("温馨提示","为确保卡片识别率，请尽量使用纯色强对比背景。",{showCancel:false})
  },
  showTip2(){
    showChoose("警告","外部接口使用第三方提供的服务，用户数据有泄漏风险!",{showCancel:false})
  }
})