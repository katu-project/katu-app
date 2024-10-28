import { loadData } from '@/utils/index'
import { getCardManager } from '@/controller/card'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
import { CreateEventBehavior } from '@/behaviors/event'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()
const cardManager = getCardManager()

app.createPage({
  i18n: {
    page: ['card']
  },

  id: '',
  chooseIdx: 0,
  chooseAction: '',
  syncMiniKey: false,
  shareData: {
    sid: '',
    sk: '',
    dk: ''
  },
  data: {
    card: {
      _id: '',
      title: '',
      tags: [] as string[],
      setLike: false,
      encrypted: false,
      image: [
        {
          _url: app.getConst('DefaultShowImage'),
          url: '',
          salt: '',
          hash: '',
          ccv: ''
        } as ICardImage
      ]
    },
    extraData: [] as AnyObject[],
    tagsInfo: [] as AnyObject[],
    syncCheck: true,
    showHideCardData: false,
    disableShareAction: true
  },
  
  behaviors: [
    CreateEventBehavior('detail'),
    CreateKeyInput()
  ],

  onLoad(options) {
    if(options.id){
      this.id = options.id
    }
    if(app.isMp){
      wx.hideShareMenu()
    }else{
      this.setData({
        disableShareAction: false
      })
    }
  },

  onUnload(){
  },

  async onReady() {
    if(!this.id) {
      await app.showNotice(this.t('card_not_exist'))
      app.navigateBack()
      return
    }

    await this.checkSyncMiniKey()
    await this.loadData()
    this.dataSyncCheck()
  },

  onEventCardChange(card){
    console.log('detail page: update card info:', card._id, card.title)
    this.loadData({hideLoading: true})
  },

  async loadData(options?:{ hideLoading?: boolean, ignoreCache?: boolean, showText?:string }){
    const { ignoreCache, showText, hideLoading } = options || {}
    try {
      const card = await loadData(
        cardManager.getCard, 
        { 
          id: this.id,
          ignoreCache
        }, 
        {
          loadingTitle: showText || this.t('loading_card'),
          hideLoading,
          returnFailed: true
        }
      )
      this.setData({
        card,
        'extraData': cardManager.rebuildExtraFields(card.info),
        'showHideCardData': card.encrypted && !user.config?.general.autoShowContent && !card.image.some(e=>e._url === app.getConst('DefaultShowLockImage'))
      })
      this.renderTagInfo()
      this.autoShowContent()
    } catch (error:any) {
      if(!hideLoading){
        await app.showNotice(error.message || this.t('loading_card_error'))
        app.navigateBack()
      }
    }
  },

  async renderTagInfo(){
    const userTags = await user.getTags()
    const tags = (user.config?.general.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(userTags)
    const cardTags = this.data.card.tags.map(name=>{
      const tag = tags.find(e=>e.name === name)
      return {
        label: tag?.default ? app.t(tag.name,[],'tag') : name,
        color: tag?.color || ''
      }
    })
    this.setData({
      'tagsInfo': cardTags
    })
  },

  autoShowContent(){
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      if(this.data.card.encrypted && user.config?.general.autoShowContent){
        this.showEncryptedImage()
      }
    }
  },

  async checkSyncMiniKey(){
    try {
      await app.miniKeyManager.checkState()
    } catch (error) {
      const { confirm } = await app.showChoose(`${this.t('use_mini_key')}?`)
      if(confirm){
        this.syncMiniKey = true
        this.showKeyInput({
          inputMode: 'adv',
          changeMode: false
        })
      }
    }
  },

  async dataSyncCheck(){
    if(!this.data.card._id) return
    loadData(cardManager.syncCheck, this.id, {
      hideLoading:true,
      finally: ()=>{
        this.setData({
          syncCheck: false
        })
      }
    }).then(async needSync=>{
      if(needSync){
        const { confirm } = await app.showChoose(`${this.t('sync_data')}?`)
        if(confirm){
          await this.loadData({ ignoreCache:true , showText:this.t('sync_new_data')})
        }
      }
    })
  },

  async tapToHideCardData(){
    await cardManager.deleteCardImageCache(this.data.card)
    app.publishCardHideEvent(this.id)
    this.loadData()
  },

  async tapToSetLike(){
    const state = !this.data.card.setLike
    await loadData(cardManager.setLike,{id:this.id,state})
    this.setData({
      'card.setLike': state
    })
    await app.cache.setCardField(this.data.card._id, 'setLike', state)
    app.publishCardChangeEvent(this.data.card)
  },

  async tapToReloadCard(){
    if(this.data.card.encrypted){
      await cardManager.deleteCardImageCache(this.data.card)
    }
    await this.loadData({ignoreCache: true})
  },

  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image![this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== app.getConst('DefaultShowLockImage')){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },

  async showEncryptedImage(){    
    const state = app.masterKeyManager.check()
    if(state){
      if(state.needKey){
        this.showKeyInput()
      }else{
        app.showNotice(state.message)
      }
      return
    }
   
    const card = await loadData(cardManager.getCard, { id: this.id, decrypt:true }, this.t('read_card'))
    const setData = {
      [`card.image`]: card.image,
      ['extraData']: cardManager.rebuildExtraFields(card.info),
      'showHideCardData': !user.config?.general.autoShowContent
    }
    this.setData(setData)
    app.publishCardDecryptEvent(card)
  },

  async previewImage(idx=0){
    const pics = this.data.card.image!.filter(e=>e._url !== app.getConst('DefaultShowLockImage')).map(e=>e._url!)
    app.previewImage(pics, idx)
  },

  tapToEditCard(){
    this.chooseAction = 'edit'
    this.hideActionDialog()
    return this.goEditCard()
  },

  goEditCard(){
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      this.showEncryptedImage()
      return
    }
    app.goCardEditPage(this.id)
  },

  tapToCopyValue(e){
    app.copyText(e.currentTarget.dataset.value)
  },

  async tapToDeleteCard(){
    this.hideActionDialog()
    await app.showConfirm(`${this.t('confirm_delete')}!`)
    loadData(cardManager.deleteCard, this.data.card).then(()=>{
      app.publishCardDeleteEvent(this.data.card)
      app.navigateBack()
    })
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent{
    // Mini Program will emit hide event caused by sharing
    getApp().globalData.state.push('inShare')
    const params = `sid=${this.shareData?.sid}&sk=${this.shareData?.sk}&dk=${this.shareData?.dk}`
    this.hideShareDialog()
    return {
      title: `From ${user.nickName} share`,
      path: `/pages/share/index?${params}`,
      imageUrl: app.getConst('DefaultShareImage')
    }
  },

  async tapToShowShareDialog(){
    this.hideActionDialog()
    if(this.data.card.encrypted){
      if(this.data.card.image?.some(pic => pic._url === app.getConst('DefaultShowLockImage') )){
        app.showNotice(this.t('decrypt_data'))
        return
      }
    }

    await app.knowDataShare()
    
    if(this.shareData.sid){
      this.showShareDialog()
      return
    }

    loadData(app.createShareItem,{card:this.data.card}).then(shareInfo=>{
      this.shareData = shareInfo
      this.showShareDialog()
    })
  },

  // Key verification via callback
  async inputKeyConfirm(){
    if(this.syncMiniKey){
      await loadData(app.syncMiniKey)
      await app.showMiniNotice(this.t('sync_success'))
      this.syncMiniKey = false
    }
    if(this.chooseAction){
      if(this.chooseAction === 'edit'){
        this.goEditCard()
      }
      this.chooseAction = ''
    }else if(this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      this.showEncryptedImage()
    }
  },

  onImageShowError(e){
    const setData = {}
    setData[`card.image[${e.currentTarget.dataset.index}]._url`] = app.getConst('DefaultLoadFailedImage')
    this.setData(setData)
    app.showNotice(this.t('load_error'))
  },

  showShareDialog(){
    this.setData({
      showShareDialog: true
    })
  },

  hideShareDialog(){
    this.setData({
      showShareDialog: false
    })
  },

  // action list
  showActionDialog(){
    this.setData({
      showActionDialog: true
    })
  },

  tapToHideActionDialog(e){
    if(!e.target.dataset.close) return
    this.hideActionDialog()
  },

  hideActionDialog(){
    this.setData({
      showActionDialog: false
    })
  }
})