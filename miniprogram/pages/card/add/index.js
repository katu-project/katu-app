const { getCardManager } = require('../../../class/card')
const { showNotice, showChoose, navigateTo, showError } = require('../../../utils/action')
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
  onLoad() {},
  async onReady() {
    this.app = globalData.app
  },
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
  async tapToSaveCard(){
    if(this.data.card.image.filter(e=>e.url === DefaultAddImage).length > 0) {
      showNotice('有未使用的卡面')
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
  tapToEditTitle(){
    
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  }
})