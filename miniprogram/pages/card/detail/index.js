const { getCardManager } = require('../../../class/card')
const { showChoose, showError, loadData, navigateBack } = require('../../../utils/index')
const { DefaultLockImage, DefaultShowImage } = require('../../../const')
const globalData = getApp().globalData

Page({
  data: {
    defaultLockImage: DefaultLockImage,
    showInputKey: false,
    card: {
      _id: '',
      title: '',
      tags: [],
      setLike: false,
      image: [
        {
          url: DefaultShowImage
        }
      ]
    }
  },
  onLoad(options) {
    if(options.id){
      this.id = options.id
    }
  },
  async onReady() {
    if(!this.id) {
      showError("卡片不存在")
      return
    }

    loadData(globalData.app.api.getCard,{
      _id: this.id
    }).then(card=>{
      this.setData({
        'card._id': card._id,
        'card.encrypted': card.encrypted,
        'card.title': card.title,
        'card.tags': card.tags,
        'card.setLike': card.setLike || false,
        'card.image': card.image.map(pic=>{
          pic._url = pic.url
          if(card.encrypted) pic._url = DefaultLockImage
          return pic
        })
      })
    })
  },
  onShow() {

  },
  tapToSetLike(){
    const state = !this.data.card.setLike
    loadData(globalData.app.api.setCardLike,{id:this.id,state}).then(()=>{
      this.setData({
        'card.setLike': state
      })
    })
  },
  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image[this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== DefaultLockImage){
      return this.previewImage()
    }
    this.showEncryptedImage()
  },
  async showEncryptedImage(){
    const image = this.data.card.image[this.chooseIdx]
    const cardManager = await getCardManager()
    const appManager = globalData.app
    try {
      await appManager.checkMasterKey()
    } catch (error) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('解密卡片出错',error.message)
      }
      return
    }

    loadData(cardManager.decryptImage, image, '解码中').then(({imagePath})=>{
      this.setData({
        [`card.image[${this.chooseIdx}]._url`]: imagePath
      })
      if(!globalData.app.user.config.security.rememberPassword){
        globalData.app.clearMasterKey()
      }
    })
  },
  async previewImage(){
    wx.previewImage({
      urls: this.data.card.image.filter(e=>e._url !== DefaultLockImage).map(e=>e._url)
    })
  },
  tapToEditCard(){
    wx.redirectTo({
      url: '../add/index?id='+ this.id,
    })
  },
  tapToDeleteCard(){
    showChoose("确认删除卡片","卡片删除后不可恢复！").then(({cancel})=>{
      if(cancel) return

      loadData(globalData.app.api.deleteCard,{_id: this.id}).then(()=>{
        navigateBack({ refresh: true })
      })
    })
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  inputKeyConfirm(e){
    const key = e.detail.value
    globalData.app.loadMasterKeyWithKey(key).then(()=>{
      this.showEncryptedImage()
    }).catch(error=>{
      showChoose(error.message,'',{showCancel:false})
    })
  },
})