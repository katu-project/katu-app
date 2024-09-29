import { loadData } from '@/utils/index'
import { getCardManager } from '@/controller/card'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
import { CreateEventBehavior } from '@/behaviors/event'

const app = getAppManager()
const user = getUserManager()
const cardManager = getCardManager()

Page({
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
    showInputKey: false,
    inputMode: '',
    inputKeyResult: '',
    changeMode: true,
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
    CreateEventBehavior('detail')
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
      await app.showNotice("卡片不存在")
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
          loadingTitle: showText || '加载卡片数据',
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
        await app.showNotice(error.message || '卡片加载错误')
        app.navigateBack()
      }
    }
  },

  async renderTagInfo(){
    const tags = (user.config?.general.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(await user.getTags())
    const cardTags = this.data.card.tags.map(tag=>{
      return {
        name: tag,
        color: tags.find(e=>e.name === tag)?.color || ''
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
      const { confirm } = await app.showChoose('在本设备使用快速密码？')
      if(confirm){
        this.syncMiniKey = true
        this.showInputKey({
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
        const { confirm } = await app.showChoose('云端数据有变动\n同步最新数据？')
        if(confirm){
          await this.loadData({ ignoreCache:true , showText:'同步最新数据'})
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
        this.showInputKey()
      }else{
        app.showNotice(state.message)
      }
      return
    }
   
    const card = await loadData(cardManager.getCard, { id: this.id, decrypt:true }, '读取卡面')
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
    return this._tapToEditCard()
  },

  _tapToEditCard(){
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      this.showEncryptedImage()
      return
    }
    app.goCardEditPage(this.id)
  },

  tapToCopyValue(e){
    app.setClipboardData(e.currentTarget.dataset.value)
  },

  async tapToDeleteCard(){
    this.hideActionDialog()
    await app.showConfirm("卡片删除后不可恢复！")
    loadData(cardManager.deleteCard, this.data.card).then(()=>{
      app.publishCardDeleteEvent(this.data.card)
      app.navigateBack()
    })
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent{
    // 取消由于分享导致的小程序 hide 事件
    getApp().globalData.state.inShareData = true
    const params = `sid=${this.shareData?.sid}&sk=${this.shareData?.sk}&dk=${this.shareData?.dk}`
    this.hideShareDialog()
    return {
      title: `来自 ${user.nickName} 分享的内容`,
      path: `/pages/share/index?${params}`,
      imageUrl: app.getConst('DefaultShareImage')
    }
  },

  async tapToShowShareDialog(){
    this.hideActionDialog()
    if(this.data.card.encrypted){
      if(this.data.card.image?.some(pic => pic._url === app.getConst('DefaultShowLockImage') )){
        app.showNotice('请先解密卡片内容')
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

  inputKeyConfirm(e){
    const key = e.detail.value
    app.masterKeyManager.loadWithKey(key).then(async ()=>{
      this.hideInputKey()
      if(this.syncMiniKey){
        await loadData(app.syncMiniKey)
        await app.showMiniNotice('同步成功')
        this.syncMiniKey = false
      }
      if(this.chooseAction){
        if(this.chooseAction === 'edit'){
          this._tapToEditCard()
        }
        this.chooseAction = ''
      }else if(this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
        this.showEncryptedImage()
      }
    }).catch(error=>{
      console.log(error)
      this.setData({
        inputKeyResult: error.message
      })
    })
  },

  showInputKey(options?){
    this.setData({
      showInputKey: true,
      ...options
    })
  },

  hideInputKey(){
    this.setData({
      showInputKey: false
    })
  },

  tapToForgetKey(){
    app.goResetKeyPage()
  },

  onImageShowError(e){
    const setData = {}
    setData[`card.image[${e.currentTarget.dataset.index}]._url`] = app.getConst('DefaultLoadFailedImage')
    this.setData(setData)
    app.showNotice('图片加载错误\n请刷新数据重新加载')
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
  },

  async tapToShowDataCheckHelp(){
    await app.showConfirm("卡片似乎存在不合适内容",'查看详情')
    app.openDataCheckDoc()
  }
})