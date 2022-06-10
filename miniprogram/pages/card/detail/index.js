const { getCardManager } = require('../../../class/card')
const { showChoose, showError, loadData } = require('../../../utils/index')

const DefaultLockImage = '/static/images/lock.svg'
const DefaultShowImage = '/static/images/image.svg'

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
    const idx = e.currentTarget.dataset.index
    const image = this.data.card.image[idx]
    if(this.data.card.encrypted && image._url === DefaultLockImage){
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
  tapToEditCard(){
    wx.redirectTo({
      url: '../add/index?id='+ this.id,
    })
  },
  tapToDeleteCard(){
    showChoose("确认删除卡片","卡片删除后不可恢复！").then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.api.deleteCard,{_id: this.id}).then(()=>{
        wx.navigateBack()
      })
    })
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  }
})