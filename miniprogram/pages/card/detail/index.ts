import { loadData } from '@/utils/index'
import { getCardManager } from '@/controller/card'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const user = getUserManager()
const cardManager = getCardManager()

Page({
  id: '',
  chooseIdx: 0,
  chooseAction: '',
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
      title: '',
      tags: [],
      setLike: false,
      encrypted: false,
      image: [
        {
          _url: app.getConst('DefaultShowImage'),
          url: '',
          salt: '',
          hash: ''
        }
      ]
    },
    extraData: [],
    tagsInfo: [],
    editable: true,
    shareable: true,
    syncCheck: true,
    showHideCardData: false
  },
  
  onLoad(options) {
    if(options.id){
      this.id = options.id
    }
    wx.hideShareMenu()
    this.removeAllEvent()
    app.on('cardChange',this.onEventCardChange)
  },

  onUnload(){
    this.removeAllEvent()
  },

  removeAllEvent(){
    app.off('cardChange',this.onEventCardChange)
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

  async loadData(options){
    const {ignoreCache, showText, hideLoading} = options || {}
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
      // this.checkActionUsability()
      this.renderTagInfo()
      this.autoShowContent()
    } catch (error:any) {
      if(!hideLoading){
        await app.showNotice(error.message || '卡片加载错误')
        app.navigateBack()
      }
    }
  },

  renderTagInfo(){
    const tags = (user.config?.general.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(user.tags)
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
      const { confirm } = await app.showChoose('已启用多端同步，同步快速密码？')
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
    if(!await cardManager.syncCheck(this.id)){
      const { confirm } = await app.showChoose('检查到云端数据有变动\n是否同步最新数据？')
      if(confirm){
        await this.loadData({ ignoreCache:true , showText:'同步最新数据'})
      }
    }
    this.setData({
      syncCheck: false
    })
  },

  async onEventCardChange(card){
    console.log('detail page: update card info:', card._id, card.title)
    this.loadData({hideLoading: true, ignoreCache: true})
  },

  async tapToHideCardData(){
    await cardManager.deleteCardImageCache(this.data.card)
    app.emit('cardHide',this.id)
    this.loadData()
  },

  tapToSetLike(){
    const state = !this.data.card.setLike
    loadData(cardManager.setLike,{id:this.id,state}).then(()=>{
      this.data.card.setLike = state
      app.emit('cardChange', this.data.card)
    })
  },

  async tapToReloadCard(){
    if(this.data.card.encrypted){
      await cardManager.deleteCardImageCache(this.data.card)
    }
    await this.loadData({ignoreCache: 'true'})
  },

  checkActionUsability(){
    if(this.data.card.image?.some(pic=>pic['checkId'] && !pic['checkPass'])){
      this.setData({
        editable: false,
        shareable: false
      })
    }
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
   
    const card = await loadData(
      cardManager.getCard, 
      {id: this.id, key:app.masterKeyManager.masterKey}, 
      '读取卡面数据'
    )
    
    const setData = {
      [`card.image`]: card.image,
      [`card.info`]: card.info,
      ['extraData']: cardManager.rebuildExtraFields(card.info),
      'showHideCardData': !user.config?.general.autoShowContent
    }
    this.setData(setData)
    app.emit('cardDecrypt', card)
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
      app.emit('cardDelete', this.data.card)
      app.navigateBack()
    })
  },

  onShareAppMessage(){
    // 取消由于分享导致的小程序 hide 事件
    getApp().globalData.state.inShareData = true
    const params = `sid=${this.shareData?.sid}&sk=${this.shareData?.sk}&dk=${this.shareData?.dk}`
    this.hideShareDialog()
    return {
      title: `来自 ${app.user.nickName} 分享的内容`,
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
        await loadData(app.miniKeyManager.sync, app.masterKeyManager.masterKey)
        await app.showNotice('快速密码同步成功')
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

  showInputKey(options){
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