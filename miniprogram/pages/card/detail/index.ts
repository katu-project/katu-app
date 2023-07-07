import { showError, loadData, navigateBack, setClipboardData, navigateTo } from '@/utils/index'
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
    } as Partial<ICard>,
    extraData: [] as IAnyObject[],
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
      showError("卡片不存在")
      return
    }

    await this.loadData()
    this.dataSyncCheck()
  },

  async loadData(options){
    const {ignoreCache, showText, hideLoading} = options || {}
    const card = await loadData(cardManager.getCard, 
                                { 
                                  id: this.id,
                                  ignoreCache
                                }, {
                                  loadingTitle: showText || '加载卡片数据',
                                  hideLoading
                                })
    this.setData({
      card,
      'extraData': app.rebuildExtraFields(card.info),
      'showHideCardData': card.encrypted && !user.config?.general.autoShowContent && card.image.some(e=>e._url !== app.getConst('DefaultShowLockImage'))
    })
    // this.checkActionUsability()
    this.autoShowContent()
  },

  autoShowContent(){
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      if(this.data.card.encrypted && user.config?.general.autoShowContent){
        this.showEncryptedImage()
      }
    }
  },

  async dataSyncCheck(){
    if(!await cardManager.syncCheck(this.id)){
      await app.showConfirm('检查到云端数据有变动\n是否同步最新数据？')
      await this.loadData({ ignoreCache:true , showText:'同步最新卡片数据'})
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
    try {
      app.checkMasterKey()
    } catch (error:any) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        app.showNotice(`解密卡片出错: ${error.message}`)
      }
      return
    }
   
    const card = await loadData(
                      cardManager.getCard, 
                      {id: this.id, key:app.masterKey}, 
                      '读取卡面数据'
                      )
    
    const setData = {
      [`card.image`]: card.image,
      [`card.info`]: card.info,
      ['extraData']: app.rebuildExtraFields(card.info),
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
    return this._tapToEditCard()
  },

  _tapToEditCard(){
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === app.getConst('DefaultShowLockImage'))){
      this.showEncryptedImage()
      return
    }

    navigateTo(`../edit/index?id=${this.id}`)
  },

  tapToCopyValue(e){
    setClipboardData(e.currentTarget.dataset.value)
  },

  tapToDeleteCard(){
    app.showConfirm("卡片删除后不可恢复！").then(()=>{
      loadData(cardManager.deleteCard, this.data.card).then(()=>{
        app.emit('cardDelete', this.data.card)
        navigateBack()
      })
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
    if(this.data.card.encrypted){
      if(this.data.card.image?.some(pic => pic._url === app.getConst('DefaultShowLockImage') )){
        app.showNotice('请先解密卡片内容')
        return
      }
    }

    const noticeReadCheck = await app.notice.getKnowShareData()
    if(!noticeReadCheck){
      const res = await app.showNotice('更多分享帮助点击【了解详情】',{
        cancelText: '了解详情',
        confirmText: '不再提示'
      })
      if(res.cancel){
        app.openDataShareDoc()
        return 
      }
      if(res.confirm){
        app.notice.setKnowShareData()
      }
    }
    
    if(this.shareData.sid){
      this.showShareDialog()
      return
    }

    loadData(app.createShareItem,{card:this.data.card}).then(shareInfo=>{
      this.shareData = shareInfo
      this.showShareDialog()
    })
  },

  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },

  inputKeyConfirm(e){
    const key = e.detail.value
    app.loadMasterKeyWithKey(key).then(()=>{
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
      showError(error.message)
      this.showInputKey()
    })
  },

  onImageShowError(e){
    const setData = {}
    setData[`card.image[${e.currentTarget.dataset.index}]._url`] = app.getConst('DefaultLoadFailedImage')
    this.setData(setData)
    showError('数据加载出错')
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

  tapToShowDataCheckHelp(){
    app.showConfirm("卡片似乎存在不合适内容",'查看详情').then(app.openDataCheckDoc)
  }
})