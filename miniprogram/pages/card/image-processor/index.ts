import { loadData, showChoose, showError, navigateBack, showNotice } from '@/utils/index'
import { DefaultShowImage } from '@/const'
import { getCardManager } from '@/controller/card'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const cardManager = getCardManager()

Page({
  originImagePath: '',
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
  async tapToSelectImage(){
    try {
      const picPath = await app.chooseLocalImage()
      if(!picPath) return
      this.setData({
        tmpImagePath: picPath
      })
      this.originImagePath = picPath
    } catch (error:any) {
      showError(error.message)
    }
  },
  async useAndBack() {
    const isKnowDataCheck = await app.notice.getKnowDataCheck()
    if(!isKnowDataCheck){
      const res = await showChoose('温馨提示','即将进行数据安全检测\n此过程会需要5-10秒',{
        cancelText: '了解详情',
        confirmText: '不再提示'
      })
      if(res.cancel){
        app.openDataCheckDoc()
        return 
      }
      if(res.confirm){
        app.notice.setKnowDataCheck()
      }
    }
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
    const confirm = await this.showRemoteApiNotice()
    if(!confirm){
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
      fail: () => {
        showNotice('暂不支持')
        this.findCardFailed('')
      }
    })
  },

  findCardFailed(error){
    if(error) {
      console.error(error)
      showError(error.message)
    }
    this.setData({
      selectedMethod: 0
    })
  },

  tapToShowInternalApiNotice(){
    showChoose("未识别出卡片？","这些小技巧能帮助提高卡片识别率！",{confirmText:'去查看'})
    .then(({confirm})=>{
      if(confirm) app.openInternalApiNotice()
    })
  },

  async showRemoteApiNotice(){
    const {confirm, cancel} = await showChoose("警告","外部接口由第三方提供!\n敏感数据请谨慎使用。",{cancelText: '去查看'})
    if(cancel) {
      app.openRemoteApiNotice()
      this.setData({
        selectedMethod: 0
      })
    }
    return confirm
  },

  tapToShowRemoteApiNotice(){
    this.showRemoteApiNotice()
  }
})