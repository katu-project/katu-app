const { getCardManager } = require('../../../class/card')
const { showChoose, showError, loadData, navigateBack, setClipboardData } = require('../../../utils/index')
const { DefaultShowLockImage, DefaultShowImage } = require('../../../const')
const globalData = getApp().globalData

Page({
  data: {
    showInputKey: false,
    card: {
      _id: '',
      title: '',
      tags: [],
      setLike: false,
      image: [
        {
          _url: DefaultShowImage
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
        'card.info': this.rebuildLabel(card.info||[]),
        'card.setLike': card.setLike || false,
        'card.image': card.image.map(pic=>{
          pic._url = pic.url
          if(card.encrypted) pic._url = DefaultShowLockImage
          return pic
        })
      })
    })
  },
  onShow() {
  },
  onUnload(){
  },
  tapToSetLike(){
    const state = !this.data.card.setLike
    loadData(globalData.app.api.setCardLike,{id:this.id,state}).then(()=>{
      this.setData({
        'card.setLike': state
      })
      globalData.app.setHomeRefresh()
    })
  },
  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image[this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== DefaultShowLockImage){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },
  async showEncryptedImage(){
    const image = this.data.card.image[this.chooseIdx]
    const cardManager = getCardManager()
    const appManager = globalData.app
    try {
      appManager.checkMasterKey()
    } catch (error) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('解密卡片出错',error.message)
      }
      return
    }

    loadData(cardManager.decryptImage, image, '解码中').then(data=>{
      const setData = {
        [`card.image[${this.chooseIdx}]._url`]: data.imagePath,
        [`card.info`]: this.rebuildLabel(data.extraData)
      }
      this.setData(setData)
    })
  },
  async previewImage(idx=0){
    const pics = this.data.card.image.filter(e=>e._url !== DefaultShowLockImage).map(e=>e._url)
    wx.previewImage({
      urls: pics,
      current: pics[idx]
    })
  },
  tapToEditCard(){
    wx.redirectTo({
      url: '../add/index?id='+ this.id,
    })
  },
  tapToCopyValue(e){
    setClipboardData(e.currentTarget.dataset.value)
  },
  tapToDeleteCard(){
    showChoose("确认删除卡片","卡片删除后不可恢复！").then(({cancel})=>{
      if(cancel) return

      loadData(globalData.app.api.deleteCard,{_id: this.id}).then(()=>{
        globalData.app.setHomeRefresh()
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
  rebuildLabel(meta){
    return meta.map(item=>{
      let label = globalData.app.Config.extraDataLabels.find(e=>e.key===item[0])
      label = Object.assign({name: '未知', value: '无'},label)
      label.value = item[1]
      return label
    })
  }
})