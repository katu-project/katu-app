const { getCardManager } = require('../../../class/card')
const { showNotice, showChoose, navigateTo, showError, loadData } = require('../../../utils/action')
const DefaultAddImage = '/static/images/add.svg'
const globalData = getApp().globalData

Page({
  data: {
    edit: false,
    card: {
      encrypted: false,
      title: '卡片名称1',
      tags: [],
      setLike: false,
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
      }
    ]
  },
  onLoad(options){
    if(options.id){
      this.id = options.id
    }
  },
  onReady(){
    this.checkSetting()
    if(this.id){
      this.loadCardData()
    }
  },
  onShow() {
    this.receiveChoosePic()
    this.receiveCardTitle()
    this.loadRenderData()
  },
  loadRenderData(){
    this.loadTagData()
  },
  loadTagData(){
    const tags = [...globalData.app.Config.tags,...globalData.app.user.customTag]
    this.setData({
      tags
    })
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
  loadCardData(){
    loadData(globalData.app.api.getCard, {_id: this.id}).then(async card=>{
      const setData = {
        edit: true,
        'card._id': card._id,
        'card.encrypted': card.encrypted,
        'card.image': card.image,
        'card.tags': card.tags,
        'card.title': card.title,
        'card.setLike': card.setLike
      }
      if(card.encrypted){
        const cardManager = await getCardManager()
        setData['card.image'] = []
        for (const pic of card.image) {
          const {imagePath} = await cardManager.decryptImage(pic)
          pic.originUrl = pic.url
          pic.url = imagePath
          setData['card.image'].push(pic)
        }
      }

      // 处理标签
      const tags = this.data.tags.map(tag=>{
        tag.selected = false
        if(card.tags.includes(tag.name)){
          tag.selected = true
        }
        return tag
      })
      setData['tags'] = tags
      this.setData(setData)
    })
  },
  async tapToSaveCard(){
    if(this.data.card.image.filter(e=>e.url === DefaultAddImage).length > 0) {
      showNotice('卡面数据不完整')
      return
    }

    const card = Object.assign({},this.data.card)
    const cardManager = await getCardManager()
    loadData(this.data.edit?cardManager.update:cardManager.add, card, {returnFailed: true})
            .then(this.saveDone)
            .catch(this.saveFailed)
            .finally(this.saveFinish)
  },
  async saveDone(){
    showChoose('操作成功','卡片数据已保存',{showCancel: false}).then(()=>{
      wx.navigateBack()
    })
  },
  async saveFailed(error){
    if(error.code){
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('保存卡片出错',error.message)
      }
    }else{
      showChoose('保存卡片出错',error.message)
    }
  },
  async saveFinish(){
    if(!globalData.app.user.config.security.rememberPassword){
      globalData.app.clearMasterKey()
    }
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
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
  changeLikeState(e){
    this.setData({
      'card.setLike': e.detail.value
    })
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
  inputKeyConfirm(e){
    const key = e.detail.value
    globalData.app.loadMasterKeyWithKey(key).then(()=>{
      this.tapToSaveCard()
    }).catch(error=>{
      showChoose(error.message,'',{showCancel:false})
    })
  },

  // 卡片名称
  tapToEditTitle(){
    navigateTo('../edit-content/index?returnContentKey=resolveCardTitle&value='+this.data.card.title)
  },
  // 标签部分
  tapToSetTag(){
    const tags = this.data.tags.filter(tag=>tag.selected).map(e=>e.name)
    this.setData({
      'card.tags': tags
    })
    this.hideSelectTag()
  },
  tapToShowSelectTag(){
    this.setData({
      showSelectTag: true
    })
  },
  tapToSelectTag(e){
    const index = this.data.tags.findIndex(tag=>tag.name === e.currentTarget.dataset.value)
    this.setData({
      [`tags[${index}].selected`]: !this.data.tags[index].selected
    })
  },
  tapToCustomTag(){
    navigateTo('../edit-tag/index')
  },
  hideSelectTag(){
    this.setData({
      showSelectTag: false
    })
  },
  tapToHideSelectTag(e){
    if(!e.target.dataset.hide) return
    return this.hideSelectTag()
  },
  // 其他
  cardSwiper(e){
    if(e.detail.source == 'touch'){
      this.setData({
        curShowPicIdx: e.detail.current
      })
    }
  },
})