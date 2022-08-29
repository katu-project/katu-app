const globalData = getApp().globalData
const { loadData, showChoose, navigateTo, showError, navigateBack } = globalData.utils
const { getCardManager } = require('../../../class/card')

Page({
  useRemoteApiConfirm: false,
  data: {
    selectedMethod: 0,
    tmpImagePath: ''
  },
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    this.setData({
      tmpImagePath: globalData.app.Constant.DefaultShowImage
    })
    this.originImagePath = options.value
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
    navigateBack({[this.returnContentKey]: this.data.tmpImagePath})
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
        this.useInternalApi()
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
  async useInternalApi(){
    const cardManager = getCardManager()
    const imageUrl = await loadData(cardManager.parseCardImageByInternalApi, this.data.tmpImagePath,{returnFailed: true}).catch(error=>{
      this.findCardFailed(error)
    })
    if(imageUrl) {
      this.setData({
        'tmpImagePath': imageUrl
      })
    }
  },
  async useRemoteApi(){
    const cardManager = getCardManager()
    if(!this.useRemoteApiConfirm) {
      this.setData({
        selectedMethod: 0
      })
      this.useRemoteApiConfirm = true
      this.showTip2('确认')
      return
    }
    const imageUrl = await loadData(cardManager.parseCardImageByRemoteApi, this.data.tmpImagePath,{returnFailed: true}).catch(error=>{
      this.findCardFailed(error)
    })
    if(imageUrl){
      this.setData({
        'tmpImagePath': imageUrl
      })
    }
  },
  findCardFailed(error){
    showError(error.message)
    this.setData({
      selectedMethod: 0
    })
  },
  showTip1(){
    showChoose("温馨提示","未识别出卡片？\n查看这些小技巧也许能提高卡片识别率！",{confirmText:'去查看'})
    .then(({cancel})=>{
      if(cancel) return
      globalData.app.navToDoc(globalData.app.Config.doc.imageProcessorTip_1)
    })
  },
  showTip2(cancelText){
    showChoose("警告","外部接口服务由第三方提供!\n更多信息请查看帮助文档。",{confirmText:'去查看',cancelText: cancelText||'取消'})
    .then(({cancel})=>{
      if(cancel) return
      globalData.app.navToDoc(globalData.app.Config.doc.imageProcessorTip_2)
    })
  },
  tapToShowWarn(){
    this.showTip2()
  }
})