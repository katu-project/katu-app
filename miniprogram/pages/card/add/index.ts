const globalData = getApp().globalData
const { showNotice, showChoose, navigateTo, showError, loadData } = globalData.utils
const { getCardManager } = require('../../../class/card')
const { DefaultAddImage } = require('../../../const')

export {}

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
      info: []
    },
    curShowPicIdx: 0,
    showInputKey: false,
    tags: []
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
    this.receiveExtraData()
    this.loadRenderData()
  },
  onUnload(){
  },
  loadRenderData(){
    this.loadTagData()
  },
  loadTagData(){
    const useDefaultTag = globalData.app.user.config.general.useDefaultTag
    const tags = [...(useDefaultTag ?globalData.app.Config.tags: []),...globalData.app.user.customTag]
    this.setData({
      tags
    })
  },
  receiveChoosePic(){
    if(this.backData && this.backData.resolveImagePath){
      const key = `card.image[${this.resolveImageIdx}].url`
      this.setData({
        [key]: this.backData.resolveImagePath
      })
      this.backData.resolveImagePath = null
      this.resolveImageIdx = 0
    }
  },
  receiveCardTitle(){
    if(this.backData && this.backData.resolveCardTitle){
      const key = `card.title`
      this.setData({
        [key]: this.backData.resolveCardTitle
      })
      this.backData.resolveCardTitle = null
    }
  },
  receiveExtraData(){
    if(this.backData && this.backData.resolveCardExtraData){
      console.log('处理额外数据:',this.backData.resolveCardExtraData);
      const key = `card.info`
      const data = JSON.parse(this.backData.resolveCardExtraData)
      this.setData({
        [key]: data
      })
      this.backData.resolveCardExtraData = null
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
        'card.info': card.info || [],
        'card.title': card.title,
        'card.setLike': card.setLike
      }
      if(card.encrypted){
        const cardManager = getCardManager()
        setData['card.image'] = []
        for (const pic of card.image) {
          const {imagePath, extraData} = await cardManager.decryptImage(pic)
          pic.url = imagePath
          if(extraData.length){
            setData['card.info'] = extraData
          }
          setData['card.image'].push(pic)
        }
      }
      this.setData(setData)
      // 处理标签
      this.renderTagState()
    })
  },
  renderTagState(){
    const tags = this.data.tags.map(tag=>{
      tag.selected = false
      if(this.data.card.tags.includes(tag.name)){
        tag.selected = true
      }
      return tag
    })
    
    this.setData({
      tags
    })
  },
  async tapToSaveCard(){
    if(this.data.card.image.filter(e=>e.url === DefaultAddImage).length > 0) {
      showNotice('卡面数据不完整')
      return
    }

    const card = Object.assign({},this.data.card)
    const cardManager = getCardManager()
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
    globalData.app.setHomeRefresh()
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  async tapToChoosePic(e){
    const index = e.currentTarget.dataset.index
    try {
      const cardManager = getCardManager()
      const picPath = await cardManager.choosePic()
      if(!picPath) return

      this.resolveImageIdx = index

      const rk = 'resolveImagePath'
      const c = picPath
      await navigateTo(`../image-processor/index?returnContentKey=${rk}&value=${c}`)
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
    const rk = 'resolveCardTitle'
    const c = this.data.card.title
    navigateTo(`../edit-content/index?returnContentKey=${rk}&value=${c}`)
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
  tapToEditExtraData(){
    const rk = 'resolveCardExtraData'
    const c = JSON.stringify(this.data.card.info)
    navigateTo(`../edit-extra/index?returnContentKey=${rk}&value=${c}`)
  },
  hideSelectTag(){
    this.setData({
      showSelectTag: false
    })
  },
  tapToHideSelectTag(e){
    if(!e.target.dataset.hide) return
    this.renderTagState()
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