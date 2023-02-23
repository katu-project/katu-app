import { showNotice, showChoose, navigateTo, showError, loadData, navigateBack } from '@/utils/index'
import { DefaultAddImage } from '@/const'
import api from '@/api'
import { getCardManager } from '@/class/card'
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { copyFile } from '@/utils/file'
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
      tags: [] as String[],
      setLike: false,
      image: [
        { url: DefaultAddImage }
      ],
      info: []
    },
    curShowPicIdx: 0,
    showInputKey: false,
    dataChange: false,
    tags: [] as ICardTag[]
  },
  onLoad(options){
    if(options.id){
      this.id = options.id
    }
    this.removeAllEvent()
    app.on('setCardImage',this.onEventSetCardImage)
    app.on('setCardTitle',this.onEventSetCardTitle)
    app.on('setCardExtraData',this.onEventSetCardExtraData)
  },
  onUnload(){
    this.removeAllEvent()
  },
  removeAllEvent(){
    app.off('onEventSelectImage')
    app.off('setCardTitle')
    app.off('setCardExtraData')
  },
  async onReady(){
    this.checkSetting()
    if(this.id){
      await loadData(this.loadCardData,{})
    }
  },
  onShow() {
    this.loadRenderData()
  },
  loadRenderData(){
    this.loadTagData()
  },
  loadTagData(){
    const useDefaultTag = user.config?.general.useDefaultTag
    const tags = (useDefaultTag ? app.Config.tags: []).concat(user.tags!)
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
  checkSetting(){
    if(user.isActive){
      if(user.config?.general.defaultUseEncrytion){
        this.setData({
          'card.encrypted': true
        })
        this.checkShowSetMasterKey()
      }
    }
  },
  async loadCardData(){
    const card = await api.getCard({_id: this.id})
    const setData = {
      edit: true,
      'card._id': card._id,
      'card.encrypted': card.encrypted,
      'card.image': card.image.map(e=>{
        e._url = e.url
        return e
      }),
      'card.tags': card.tags,
      'card.info': card.info || [],
      'card.title': card.title,
      'card.setLike': card.setLike
    }
    if(card.encrypted){
      setData['card.image'] = []
      for (const pic of card.image) {
        const {imagePath, extraData} = await cardManager.getCard(pic)
        pic.url = imagePath
        console.warn({imagePath, extraData});
        
        // 每个图片都包含了附加数据，因此下面操作只需要执行一次就好
        if(extraData.length){
          setData['card.info'] = extraData as ICardExtraField[]
        }
        setData['card.image'].push(pic)
      }
    }
    this.setData(setData)
    this.originData = JSON.parse(JSON.stringify(this.data.card))
    // 处理标签
    this.renderTagState()
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
    const card = Object.assign({},this.data.card)
    // 卡片数据有效性检查
    if(card.image.filter(e=>e.url === DefaultAddImage).length > 0) {
      showNotice('请先添加卡片')
      return
    }
    // 检查卡面数量
    if(card.image.length > app.Config.cardImageMaxNum) {
      showNotice("卡面数量错误")
      return
    }

    // 相关警告提示
    if(!card.encrypted){
      const noticeReadCheck = await app.getKnowEncryptSaveNotice()
      if(!noticeReadCheck){
        const res = await showChoose('温馨提示','非加密保存有数据泄漏风险！',{
          cancelText: '了解详情',
          confirmText: '不再提示'
        })
        if(res.cancel){
          app.openDataSaveSecurityNoticeDoc()
          return 
        }
        if(res.confirm){
          app.setKnowEncryptSaveNotice()
        }
      }
    }
    
    // 加密模式下，主密码有效性预检查
    if(card.encrypted){
      try {
        app.checkMasterKey()
      } catch (error) {
        if(error.code[0] === '2'){
          this.showInputKey()
        }else{
          showChoose('保存卡片出错',error.message)
        }
        return
      }
    }
    
    // 提前检查可用额度，避免因为可用额度不足而导致处理卡片数据产生无效的消耗
    if(!this.data.edit){
      try {
        await user.checkQuota(card.encrypted)
      } catch (error) {
        showChoose('无法创建卡片',error.message,{showCancel: false})
        return
      }
    }

    loadData(this.data.edit?cardManager.update:cardManager.add, card, {returnFailed: true})
            .then(this.saveDone)
            .catch(this.saveFailed)
            .finally(this.saveFinish)
  },
  async saveDone(card){
    await this.preLoadEncrypted(card)
    app.emit('cardChange',card)
    showChoose('操作成功','卡片数据已保存',{showCancel: false}).then(()=>{
      navigateBack()
    })
  },
  async saveFailed(error){
    showChoose('保存卡片出错',error.message)
  },
  async saveFinish(){
  },
  async preLoadEncrypted(card:ICard){
    if(card.encrypted){
      for (const idx in card.image) {
        const image = card.image[idx]
        const srcPath = this.data.card.image[idx].url
        try {
          await cardManager.getCardImagePathCache(image)
        } catch (error) {
          const destPath = await cardManager.getDecryptedImageLocalSavePath(card.image[idx])
          await copyFile(srcPath,destPath)
          await cardManager.cacheExtraData(image, this.data.card.info)
        }
      }
    }
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  async tapToChoosePic(){
    if(!user.isActive){
      app.showActiveNotice()
      return
    }

    try {
      const picPath = await app.chooseLocalImage()
      if(!picPath) return

      await navigateTo(`../image-processor/index?value=${picPath}`)
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
    this.checkDataChange()
  },

  changeEncrypt(e){
    this.setData({
      'card.encrypted': e.detail.value
    })
    if(e.detail.value){
      if(!user.isActive){
        app.showActiveNotice()
        return
      }
      this.checkShowSetMasterKey()
    }
  },

  changeLikeState(e){
    this.setData({
      'card.setLike': e.detail.value
    })
    this.checkDataChange()
  },

  checkShowSetMasterKey(){
    if(!user.baseInfo.setMasterKey){
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
    app.loadMasterKeyWithKey(key).then(()=>{
      this.tapToSaveCard()
    }).catch(error=>{
      showChoose(error.message,'',{showCancel:false})
    })
  },

  // 卡片名称
  tapToEditTitle(){
    const c = this.data.card.title
    navigateTo(`../edit-content/index?value=${c}`)
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

  tapToShowEncryptChangeNotice(){
    if(this.id){
      showChoose('温馨提示','更新卡片暂不支持切换加密模式',{showCancel:false})
    }
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
    const c = JSON.stringify(this.data.card.info)
    navigateTo(`../edit-extra/index?value=${c}`)
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

  checkDataChange(){
    const originCard = this.originData
    const editCard = this.data.card
    let dataChange = false
    // 名字
    if(originCard.title !== editCard.title){
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