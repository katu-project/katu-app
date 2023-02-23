import { loadData, showChoose, showError, navigateBack } from '@/utils/index'
import { DefaultShowImage } from '@/const'
import { getCardManager } from '@/class/card'
import { getAppManager } from '@/class/app'
const app = getAppManager()

Page({
  originImagePath: '',
  useRemoteApiConfirm: false,
  data: {
    selectedMethod: 0,
    tmpImagePath: ''
  },
  onLoad(options) {
    this.setData({
      tmpImagePath: DefaultShowImage
    })
    if(options.value){
      this.originImagePath = options.value
    }else{
      navigateBack()
    }
  },
  onReady() {
    this.setData({
      tmpImagePath: this.originImagePath
    })
  },
  onShow() {

  },
  goBack(){
    navigateBack()
  },
  async useAndBack() {
    const res = await loadData(app.imageContentCheck,{imagePath:this.data.tmpImagePath},'内容安全检测中')
    if(!res.checkPass){
      showChoose("系统提示","图片存在不适内容?",{showCancel:false})
      return
    }
    app.emit('setCardImage',this.data.tmpImagePath)
    navigateBack()
  },
  async selectMethod(e){
    return this.processImage(parseInt(e.detail.value))
  },
  async processImage(idx){
    const imageUrl = this.originImagePath
    switch (idx) {
      case 1:
        this.useInternalApi(imageUrl)
        break
      case 2:
        this.useRemoteApi(imageUrl)
        break
      case 3:
        this.useWxEditor(imageUrl)
        break
      case 0:
      default:
        this.useOriginImage(imageUrl)
    }
  },
  async useOriginImage(src){
    this.setData({
      'tmpImagePath': src
    })
  },
  async useInternalApi(src){
    const cardManager = getCardManager()
    const imageUrl = await loadData(cardManager.parseCardImageByInternalApi, src, {returnFailed: true}).catch(error=>{
      this.findCardFailed(error)
    })
    if(imageUrl) {
      this.setData({
        'tmpImagePath': imageUrl
      })
    }
  },
  async useRemoteApi(src){
    const cardManager = getCardManager()
    if(!this.useRemoteApiConfirm) {
      this.setData({
        selectedMethod: 0
      })
      this.useRemoteApiConfirm = true
      this.showTip2('确认')
      return
    }
    const imageUrl = await loadData(cardManager.parseCardImageByRemoteApi, src ,{returnFailed: true}).catch(error=>{
      this.findCardFailed(error)
    })
    if(imageUrl){
      this.setData({
        'tmpImagePath': imageUrl
      })
    }
  },
  async useWxEditor(src){
    wx.editImage({
      src,
      success: ({tempFilePath})=>{
        this.setData({
          'tmpImagePath': tempFilePath
        })
      },
      fail: () => this.findCardFailed('')
    })
  },
  findCardFailed(error){
    if(error) {
      showError(error.message)
    }
    this.setData({
      selectedMethod: 0
    })
  },
  showTip1(){
    showChoose("温馨提示","未识别出卡片？\n查看这些小技巧也许能提高卡片识别率！",{confirmText:'去查看'})
    .then(({confirm})=>{
      if(confirm) app.navToDoc(app.Config.doc.imageProcessorTip_1)
    })
  },
  showTip2(cancelText?:string){
    showChoose("警告","外部接口服务由第三方提供!\n更多信息请查看帮助文档。",{confirmText:'去查看',cancelText: cancelText||'取消'})
    .then(({confirm})=>{
      if(confirm) app.navToDoc(app.Config.doc.imageProcessorTip_2)
    })
  },
  tapToShowWarn(){
    this.showTip2()
  }
})