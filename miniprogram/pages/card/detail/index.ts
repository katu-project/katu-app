import { DefaultShowLockImage, DefaultShowImage, DefaultShareImage, DefaultLoadFailedImage } from '@/const'
import { showChoose, showError, loadData, navigateBack, setClipboardData, navigateTo, showNotice } from '@/utils/index'
import { getCardManager } from '@/class/card'
import { getAppManager } from '@/class/app'
const app = getAppManager()
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
      _id: '',
      title: '',
      tags: [],
      setLike: false,
      encrypted: false,
      image: [
        {
          _url: DefaultShowImage,
          url: '',
          salt: '',
          hash: ''
        }
      ]
    } as Partial<ICard>,
    extraData: [] as IAnyObject[],
    editable: true,
    shareable: true,
    syncCheck: true
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
    if(this.data.card.encrypted && this.data.card.image?.some(e=>e._url === DefaultShowLockImage)){
      try {
        app.checkMasterKey()
      } catch (error) {
        if(error.code[0] === '2'){
          this.showInputKey()
        }
      }
    }
  },
  async loadData(forceUpdate){
    const card = await loadData(cardManager.fetch,{ id: this.id, forceUpdate})
    await this.renderData(card)
  },
  async renderData(card){
    this.setData({
      'card._id': card._id,
      'card.encrypted': card.encrypted,
      'card.title': card.title,
      'card.tags': card.tags,
      'card.info': card.encrypted ? [] : card.info,
      'extraData': card.encrypted ? [] : app.rebuildExtraFields(card.info),
      'card.setLike': card.setLike || false,
      'card.image': card.image.map(pic=>{
        // 不要直接修改只读数据
        const _pic = Object.assign({},pic)
        _pic._url = pic.url
        if(card.encrypted) _pic._url = DefaultShowLockImage
        return _pic
      })
    })
    this.checkActionUsability()
    if(this.data.card.encrypted){
      if(app.user.config?.general.autoShowContent){
        const setData = {}
        for (const idx in this.data.card.image) {
          const image = this.data.card.image[idx]
          try {
            const imageData = await cardManager.getCardImageCache(image)
            setData[`card.image[${idx}]._url`] = imageData.imagePath 
            setData[`card.info`] = imageData.extraData
            setData['extraData'] = app.rebuildExtraFields(imageData.extraData)
          } catch (error) {}
        }
        if(Object.keys(setData).length){
          this.setData(setData)
        }
      }
    }
  },
  async onEventCardChange(card){
    console.log('detail page: update card info:', card._id, card.title)
    cardManager.clearCardItemCache(card._id)
    this.renderData(card)
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
    await this.loadData(true)
    if(this.data.card.encrypted){
      this.showEncryptedImage()
    }
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
    if(!this.data.card.encrypted || image._url !== DefaultShowLockImage){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },
  async showEncryptedImage(){       
    try {
      app.checkMasterKey()
    } catch (error) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('解密卡片出错',error.message)
      }
      return
    }

    const image = this.data.card.image![this.chooseIdx]
    const imageData = await loadData(cardManager.getCardImage, image, '解码中')
    
    const setData = {
      [`card.image[${this.chooseIdx}]._url`]: imageData.imagePath,
      [`card.info`]: imageData.extraData,
      ['extraData']: app.rebuildExtraFields(imageData.extraData)
    }
    this.setData(setData)
    if(this.chooseIdx === 0){
      app.emit('cardDecrypt',this.data.card)
    }
  },
  async previewImage(idx=0){
    const pics = this.data.card.image!.filter(e=>e._url !== DefaultShowLockImage).map(e=>e._url!)
    app.previewImage(pics, idx)
  },
  tapToEditCard(){
    this.chooseAction = 'edit'
    return this._tapToEditCard()
  },
  _tapToEditCard(){
    if(this.data.card.encrypted){
      try {
        app.checkMasterKey()
      } catch (error) {
        if(error.code[0] === '2'){
          this.showInputKey()
        }else{
          showChoose('解密卡片出错',error.message)
        }
        return
      }
    }

    navigateTo(`../edit/index?id=${this.id}`)
  },
  tapToCopyValue(e){
    setClipboardData(e.currentTarget.dataset.value)
  },
  tapToDeleteCard(){
    showChoose("确认删除卡片","卡片删除后不可恢复！").then(({cancel})=>{
      if(cancel) return

      loadData(cardManager.deleteCard, this.data.card).then(()=>{
        app.emit('cardDelete', this.data.card)
        navigateBack()
      })
    })
  },
  async dataSyncCheck(){
    if(!await cardManager.syncCheck(this.id)){
      console.log('远程数据有变动，同步最新数据')
      // 考虑有无删除缓存数据的必要
      // await cardManager.deleteCardCache(this.data.card)
      await this.loadData()
      if(this.data.card.encrypted){
        this.showEncryptedImage()
      }
    }
    this.setData({
      syncCheck: false
    })
  },
  onShareAppMessage(){
    // 取消由于分享导致的小程序 hide 事件
    getApp().globalData.state.inShareData = true
    const params = `sid=${this.shareData?.sid}&sk=${this.shareData?.sk}&dk=${this.shareData?.dk}`
    return {
      title: `来自 ${app.user.nickName} 分享的内容`,
      path: `/pages/share/index?${params}`,
      imageUrl: DefaultShareImage
    }
  },
  async tapToShowShareDialog(){
    if(this.data.card.encrypted){
      if(this.data.card.image?.some(pic => pic._url === DefaultShowLockImage )){
        showNotice('请先解密卡片内容')
        return
      }
    }

    const noticeReadCheck = await app.getKnowShareDataNotice()
    if(!noticeReadCheck){
      const res = await showChoose('温馨提示','更多分享帮助点击【了解详情】',{
        cancelText: '了解详情',
        confirmText: '不再提示'
      })
      if(res.cancel){
        app.openDataSaveSecurityNoticeDoc()
        return 
      }
      if(res.confirm){
        app.setKnowShareDataNotice()
      }
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
      }else if(this.data.card.image?.some(e=>e._url === DefaultShowLockImage)){
        this.showEncryptedImage()
      }
    }).catch(error=>{
      showError(error.message)
      this.showInputKey()
    })
  },
  onImageShowError(e){
    const setData = {}
    setData[`card.image[${e.currentTarget.dataset.index}]._url`] = DefaultLoadFailedImage
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
    showChoose("关于内容安全检测","该卡片似乎存在不合适内容",{
      cancelText: '查看详情'
    }).then(res=>{
      if(!res.confirm){
        app.navToDoc('534fc1e163b68f2700197d67754d9673')
      }
    })
  }
})