const { getCardManager } = require('../../../class/card')
const { showNotice, showChoose, navigateTo, showError, loadData } = require('../../../utils/action')
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
    curShowPicIdx: 0,
    showInputKey: false
  },
  onReady(){
    const {app:{user:{config}}} = globalData
    console.log(config);
    if(config.general.defaultCreateCardType){
      this.setData({
        'card.encrypted': true
      })
    }
  },
  onShow() {
    this.receiveChoosePic()
    this.receiveCardTitle()
  },
  receiveChoosePic(){
    if(this.resolveImagePath){
      const key = `card.image[${this.resolveImageIdx}].url`
      this.setData({
        [key]: this.resolveImagePath
      })
      this.resolveImagePath = null
      this.resolveImageIdx = 0
    }
  },
  receiveCardTitle(){
    if(this.resolveCardTitle){
      const key = `card.title`
      this.setData({
        [key]: this.resolveCardTitle
      })
      this.resolveCardTitle = null
    }
  },
  async tapToSaveCard(){
    if(this.data.card.image.filter(e=>e.url === DefaultAddImage).length > 0) {
      showNotice('卡面数据不完整')
      return
    }

    const card = Object.assign({},this.data.card)
    const cardManager = await getCardManager()

    loadData(cardManager.add, card, {returnFailed: true})
            .then(this.saveDone)
            .catch(this.saveFailed)
  },
  async saveDone(){
    showChoose('操作成功','卡片数据已保存',{showCancel: false}).then(()=>{
      wx.navigateBack()
    })
  },
  async saveFailed(error){
    if(error.code === '01'){
      showChoose('操作警告',error.message,{}).then(()=>{
        navigateTo('../../settings/security/master-key/index',false)
      })
    }else if(error.code === '02'){
      this.showInputKey()
    }else{
      showChoose('保存卡片出错',error.message)
    }
  },

  async tapToChoosePic(e){
    const index = e.currentTarget.dataset.index
    try {
      const cardManager = await getCardManager()
      const picPath = await cardManager.choosePic()
      if(!picPath) return

      this.resolveImageIdx = index
      await navigateTo(`../image-processor/index?p=${picPath}`)
    } catch (error) {
      showError(error.message)
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

  changeEncrypt(){
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

  tapToEditTitle(){
    navigateTo('../edit-content/index?returnContentKey=resolveCardTitle')
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  }
})