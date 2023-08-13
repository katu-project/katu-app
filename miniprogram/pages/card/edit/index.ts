import { loadData } from '@/utils/index'
import { getCardManager } from '@/controller/card'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

Page({
  id: '',
  originData: {} as ICard,
  data: {
    edit: false,
    card: {
      encrypted: false,
      title: '卡片名称1',
      tags: [],
      setLike: false,
      image: [
        { url: app.getConst('DefaultAddImage') }
      ],
      info: []
    },
    curShowPicIdx: 0,
    showInputKey: false,
    inputKeyResult: '',
    dataChange: false,
    tags: []
  },

  onLoad(options){
    if(options.id){
      this.id = options.id
    }
    this.removeAllEvents()
    this.addAllEvents()
  },

  onUnload(){
    this.removeAllEvents()
  },

  addAllEvents(){
    app.on('setCardImage',this.onEventSetCardImage)
    app.on('setCardTitle',this.onEventSetCardTitle)
    app.on('setCardExtraData',this.onEventSetCardExtraData)
    app.on('tagChange', this.onEventTagChange)
  },

  removeAllEvents(){
    app.off('setCardImage')
    app.off('setCardTitle')
    app.off('setCardExtraData')
    app.off('tagChange')
  },

  async onReady(){
    this.applyUserSetting()
    this.loadTagData()
    if(this.id){
      await this.loadData()
      // 处理卡片标签选中状态
      this.renderTagState()
    }
  },

  onShow() {
  },

  loadRenderData(){
    this.loadTagData()
  },

  loadTagData(){
    const tags = (this.data.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(user.tags)
    // 记录【其他】标签的idx
    this.otherTagIdx = tags.findIndex(e=>e._id === 'oc')
    this.setData({
      tags
    })
  },

  onEventSetCardImage(path){
    const key = `card.image[${this.data.curShowPicIdx}].url`
    this.setData({
      [key]: path
    })
    this.checkDataChange()
  },

  onEventSetCardTitle(title){
    console.log('edit title:', title)
    this.setData({
      [`card.title`]: title
    })
    this.checkDataChange()
  },

  onEventSetCardExtraData(extraData){
    console.log('edit extraData:', JSON.stringify(extraData))
    this.setData({
      [`card.info`]: extraData
    })
    this.checkDataChange()
  },

  onEventTagChange(){
    this.loadTagData()
    this.renderTagState()
  },

  applyUserSetting(){
    if(user.isActive){
      const setData = {
        'card.encrypted': false,
        useDefaultTag: true
      }
      if(user.config?.general.defaultUseEncrytion){
        setData['card.encrypted'] = true
      }
      if(!user.config?.general.useDefaultTag){
        setData.useDefaultTag = false
      }
      this.setData(setData)
    }
  },

  async loadData(){
    const card = await loadData(
                  cardManager.getCard, 
                  { id: this.id, 
                    ignoreCache: true
                  }
                )
    
    // todo: 临时处理，后续需要统_url的定义
    card.image.map(e=> {
      const t = e.url
      e.url = e._url!
      e._url = t
    })

    const setData = {
      edit: true,
      card
    }
    this.setData(setData)
    this.originData = JSON.parse(JSON.stringify(this.data.card))
  },

  renderTagState(){
    const tags = this.data.tags.map(tag=>{
      tag['selected'] = false
      if(this.data.card.tags.includes(tag.name)){
        tag['selected'] = true
      }
      return tag
    })
    const cardTags = this.data.card.tags.filter(tag=>tags.some(e=>e.name === tag))
    this.setData({
      tags,
      'card.tags': cardTags
    })
  },

  async tapToSaveCard(){
    const card = this.data.card
    // 卡片数据有效性检查
    if(card.image.filter(e=>e.url === app.getConst('DefaultAddImage')).length > 0) {
      app.showNotice('请先添加卡片')
      return
    }
    // 检查卡面数量
    if(card.image.length > app.getConfig('cardImageMaxNum')) {
      app.showNotice("卡面数量错误")
      return
    }

    // 相关警告提示
    if(!card.encrypted){
      await app.knowDataEncrypt()
    }
    
    // 加密模式下，主密码有效性预检查
    if(card.encrypted){
      if(!user.isSetMasterKey){
        await app.showSetMasterKeyNotice()
        return
      }
      try {
        app.checkMasterKey()
      } catch (error:any) {
        if(error.code[0] === '2'){
          this.showInputKey()
        }else{
          this.saveFailed(error)
        }
        return
      }
    }
    
    // 提前检查可用额度，避免因为可用额度不足而导致处理卡片数据产生无效的消耗
    if(!this.data.edit){
      try {
        await user.checkQuota()
      } catch (error:any) {
        this.saveFailed(error)
        return
      }
    }

    loadData(this.data.edit?cardManager.update:cardManager.add, {card, key: app.masterKey}, {returnFailed: true})
            .then(this.saveDone)
            .catch(this.saveFailed)
            .finally(this.saveFinish)
  },

  async saveDone(card){ 
    console.debug(`提前缓存${this.data.edit?'修改':'新增'}卡片`)
    cardManager.cacheCard(card, this.data.card).then(()=>{
      app.emit('cardChange',card)
    })
    await app.showNotice('卡片数据已保存')
    app.navigateBack()
  },

  async saveFailed(error){
    return app.showNotice(`${error.message}`)
  },

  async saveFinish(){
  },

  // key input section
  inputKeyConfirm(e){
    const key = e.detail.value
    app.loadMasterKeyWithKey(key).then(()=>{
      this.hideInputKey()
      this.tapToSaveCard()
    }).catch(error=>{
      this.setData({
        inputKeyResult: error.message
      })
    })
  },

  showInputKey(){
    this.setData({
      showInputKey: true
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

  async tapToChoosePic(){
    if(!user.isActive){
      app.showActiveNotice(true)
      return
    }

    try {
      const picPath = await app.chooseLocalImage()
      if(!picPath) return
      await app.goEditImagePage(picPath)
    } catch (error:any) {
      console.error(error)
      app.showNotice(`选取错误: ${error.message||'未知错误'}`)
    }
  },

  addCardPic(){
    const idx = this.data.card.image.length
    if(idx == 1){
      this.setData({
        'card.image': this.data.card.image.concat({url: app.getConst('DefaultAddImage')})
      })
    }else{
      this.setData({
        curShowPicIdx: 0,
        'card.image': this.data.card.image.slice(0,-1)
      })
    }
    this.checkDataChange()
  },

  async onBindCryptModeChange(e){
    this.changeCryptoMode(e.detail.value)
    if(user.isActive && e.detail.value){
      if(!user.isSetMasterKey){
        this.changeCryptoMode(false)
        await app.showSetMasterKeyNotice()
      }
    }
  },

  changeCryptoMode(value:boolean){
    this.setData({
      'card.encrypted': value
    })
  },

  changeLikeState(e){
    this.setData({
      'card.setLike': e.detail.value
    })
    this.checkDataChange()
  },

  // 卡片名称
  tapToEditTitle(){
    app.goEditContentPage(this.data.card.title)
  },

  tapToShowEncryptChangeNotice(){
    if(this.id){
      app.showNotice('更新卡片暂不支持切换加密模式')
    }
  },

  tapToEditExtraData(){
    const c = JSON.stringify(this.data.card.info)
    const tag = this.data.tags.find(e=>e.selected && e.field)?._id || ''
    app.goEditExtraDataPage(c,tag)
  },

  // 标签部分
  tapToSetTag(){
    const tags = this.data.tags.filter(tag=>tag.selected).map(e=>e.name)
    this.setData({
      'card.tags': tags
    })
    this.hideSelectTag()
    this.checkDataChange()
  },

  tapToCancelSelectTag(){
    this.renderTagState()
    return this.hideSelectTag()
  },

  tapToShowSelectTag(){
    this.setData({
      showSelectTag: true
    })
  },

  tapToSelectTag(e){
    const index = parseInt(e.currentTarget.dataset.value)
    const setData = {}
    if(this.otherTagIdx === index){
      if(this.data.tags[this.otherTagIdx].selected){
        setData[`tags[${index}].selected`] = false
      }else{
        this.data.tags.map((e,idx)=>{
          if(e.selected){
            setData[`tags[${idx}].selected`] = false
          }
        })
        setData[`tags[${index}].selected`] = true
      }     
    }else{
      setData[`tags[${index}].selected`] = !this.data.tags[index]['selected']
      if(this.otherTagIdx >=0 && this.data.tags[this.otherTagIdx].selected){
        setData[`tags[${this.otherTagIdx}].selected`] = false
      }
    }
    this.setData(setData)
  },

  tapToCustomTag(){
    app.goEditTagPage()
  },

  hideSelectTag(){
    this.setData({
      showSelectTag: false
    })
  },

  // 其他
  cardSwiper(e){
    if(e.detail.source == 'touch'){
      this.setData({
        curShowPicIdx: e.detail.current
      })
    }
  },

  checkDataChange(){
    const originCard = this.originData
    const editCard = this.data.card
    let dataChange = false
    // 名字
    if(originCard?.title !== editCard?.title){
      dataChange = true
    }else
    // 标签
    if(originCard.tags.join('') !== editCard.tags.join('')){
      dataChange = true
    }else
    // 设置常用
    if(originCard.setLike !== editCard.setLike){
      dataChange = true
    }else
    // 附件数据
    if(originCard.info.join() !== editCard.info.join()){
      dataChange = true
    }else
    // 图片
    if(originCard.image.length !== editCard.image.length || 
       originCard.image.map(e=>e.url).join('') !== editCard.image.map(e=>e.url).join('')){
      dataChange = true
    }

    this.setData({
      dataChange
    })
  }
})