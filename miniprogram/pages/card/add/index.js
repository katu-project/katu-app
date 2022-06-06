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
    showInputKey: false,
    tags: [
      {
        name: '银行卡',
        selected: false
      },
      {
        name: '信用卡',
        selected: false
      },
      {
        name: '自定义',
        value: 'custom'
      }
    ]
  },
  onReady(){},
  onShow() {
    this.receiveChoosePic()
    this.receiveCardTitle()
    this.checkSetting()
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
  checkSetting(){
    const {app:{user}} = globalData
    if(user.config.general.defaultUseEncrytion){
      this.setData({
        'card.encrypted': true
      })
      this.checkShowSetMasterKey()
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
    if(!globalData.app.user.config.security.rememberPassword){
      globalData.app.clearMasterKey()
    }
    showChoose('操作成功','卡片数据已保存',{showCancel: false}).then(()=>{
      wx.navigateBack()
    })
  },
  async saveFailed(error){
    if(error.code){
      if(error.code[0] === '1'){
        showChoose('操作警告',error.message).then(({cancel})=>{
          if(cancel) return
          navigateTo('../../settings/security/master-key/index',false)
        })
      }else if(error.code[0] === '2'){
        this.showInputKey()
      }
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

  changeEncrypt(e){
    this.setData({
      'card.encrypted': e.detail.value
    })
    if(e.detail.value){
      this.checkShowSetMasterKey()
    }
  },
  checkShowSetMasterKey(){
    const {app:{user}} = globalData
    if(!user.setMasterKey){
      showChoose("警告","未设置主密码",{confirmText:'去设置'}).then(({cancel})=>{
        if(cancel) {
          this.changeEncrypt({detail:{value: false}})
          return
        }
        navigateTo('/pages/settings/security/master-key/index')
      })
    }
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
  },
  inputKeyConfirm(e){
    const key = e.detail.value
    
    // await loadData(globalData.app.checkSetAndReloadMasterKey, key,'验证中')
  },
  tapToShowSelectTag(){
    this.setData({
      showSelectTag: true
    })
  },
  tapToSelectTag(e){
    const index = this.data.tags.findIndex(tag=>tag.name === e.currentTarget.dataset.value)
    console.log({index});
    if(this.data.tags[index].value == 'custom'){
      navigateTo('../edit-tag/index')
      return
    }
    this.setData({
      [`tags[${index}].selected`]: !this.data.tags[index].selected
    })
  },
  hideSelectTag(){
    this.setData({
      showSelectTag: false
    })
  }
})