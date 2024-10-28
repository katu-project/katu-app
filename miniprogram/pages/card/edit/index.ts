import { loadData } from '@/utils/index'
import { getCardManager } from '@/controller/card'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateEventBehavior } from '@/behaviors/event'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['cardEdit']
  },

  id: '',
  originData: {} as ICard,
  otherTagIdx: -1,

  saveState: {} as Map<string,ICardImage>,

  behaviors: [
    CreateEventBehavior('edit'),
    CreateKeyInput()
  ],

  data: {
    edit: false,
    useDefaultTag: true,
    card: {
      _id: '',
      encrypted: true,
      title: '',
      tags: [] as string[],
      setLike: false,
      image: [
        { url: app.getConst('DefaultAddImage') }
      ],
      info: [] as AnyArray[]
    },
    curShowPicIdx: 0,
    dataChange: false,
    tags: [] as AnyObject[]
  },

  onLoad(options){
    if(options.id){
      this.id = options.id
    }
    this.saveState = new Map()
  },

  onUnload(){
  },

  onEventCardEditImage(path){
    const key = `card.image[${this.data.curShowPicIdx}].url`
    this.setData({
      [key]: path
    })
    this.checkDataChange()
  },

  onEventCardEditTitle(title){
    console.debug('edit title:', title)
    this.setData({
      [`card.title`]: title
    })
    this.checkDataChange()
  },

  onEventCardEditExtraData(extraData){
    console.log('edit extraData:', JSON.stringify(extraData))
    this.setData({
      [`card.info`]: extraData
    })
    this.checkDataChange()
  },

  async onEventTagChange(){
    await this.loadTagData()
    this.renderTagState()
  },

  async onReady(){
    this.applyUserSetting()
    this.loadRenderData()
    if(this.id){
      await this.loadData()
      // Handles the card label selected status
      this.renderTagState()
    }else{
      this.setData({
        'card.title': this.t('new_card')
      })
    }
  },

  onShow() {
  },

  loadRenderData(){
    this.loadTagData()
  },

  async loadTagData(){
    const userTags = await user.getTags()
    const tags = (this.data.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(userTags)
    // save【other】tag idx
    this.otherTagIdx = tags.findIndex(e=>e.default && e.name === 'oc')
    // i18n builder
    tags.map(tag=>{
      tag['label'] = tag.default ? app.t(tag.name, [], 'tag') : tag.name
    })
    this.setData({
      tags
    })
  },

  applyUserSetting(){
    if(user.isActive){
      const setData = {}
      if(!user.config?.general.useDefaultTag){
        setData['useDefaultTag'] = false
      }
      this.setData(setData)
    }
  },

  async loadData(){
    const card = await loadData(cardManager.getCard, { id: this.id })
    // The original image data is recorded, and the image is judged to be changed when saved
    // Detect Picture Paths and extra Data
    card.image.map(e=>{
      const image = JSON.parse(JSON.stringify(e))
      const saveKey = `${image._url}-${JSON.stringify(card.info)}`
      delete image._url
      this.saveState.set(saveKey, image)
    })

    // url remote
    // _url local
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
    // remove invalid tag
    const cardTags = this.data.card.tags.filter(tag=>tags.some(e=>e.name === tag))
    this.setData({
      tags,
      'card.tags': cardTags
    })
  },

  async tapToSaveCard(){
    const card = this.data.card
    // check image
    if(card.image.filter(e=>e.url === app.getConst('DefaultAddImage')).length > 0) {
      app.showNotice(this.t('add_pic_first'))
      return
    }
    // check image number
    if(card.image.length > app.getConfig('cardImageMaxNum')) {
      app.showNotice(this.t('pic_num_err'))
      return
    }

    if(!user.isActive){
      await app.showActiveNotice()
      return
    }

    if(!user.isSetMasterKey){
      await app.showSetMasterKeyNotice()
      return
    }
    
    // check quota
    if(!this.data.edit){
      try {
        await user.checkQuota()
      } catch (error:any) {
        app.showNotice(this.t('recharge_quota'))
        return
      }
    }

    const savedImages:ICardImage[] = []
    for (const idx in card.image) {
      const image = card.image[idx] as ICardImage
      const saveKey = `${image.url}-${JSON.stringify(card.info)}`
      if(this.saveState.has(saveKey)){
        console.debug('use cache data:',saveKey)
        savedImages.push(this.saveState.get(saveKey)!)
      }else{
        // need input key when save crypto data
        const state = app.masterKeyManager.check()
        if(state){
          if(state.needKey){
            this.showKeyInput()
          }else{
            app.showNotice(`${state.message}`)
          }
          return
        }

        if(card._id){
          if(image._url) {
            console.debug(`UPDATE - pic/extradata change`)
          }else{
            console.debug(`UPDATE - new pic`)
          }
        }else{
          console.debug('CREATE - new pic')
        }

        const savedImage = await loadData(cardManager.saveImage, {
          imageLocalPath: image.url,
          info: card.info
        }, `${this.t('save_pic')} ${+idx+1}`)
        this.saveState.set(saveKey, savedImage)
        savedImages.push(savedImage as ICardImage)
      }
    }

    const savedCard = await loadData(cardManager.save, {
      card: card as ICard, 
      images: savedImages
    },this.t('save_card_info'))

    console.debug(`pre cache ${this.data.edit?'Edit':'Add'} card`)
    await cardManager.cacheCard(savedCard, this.data.card as ICard)
    app.publishCardChangeEvent(savedCard)
    await app.showNotice(`${this.data.edit? this.t('update_success') : this.t('save_success')}`)
    app.navigateBack()
  },

  // callback when key verify
  inputKeyConfirm(){
    this.tapToSaveCard()
  },

  async tapToChoosePic(){
    try {
      const picPath = await app.chooseLocalImage()
      if(!picPath) return
      await app.goEditImagePage(picPath)
    } catch (error:any) {
      console.error(error)
      app.showNotice(this.t('choose_pic_error'))
    }
  },

  async longtapToChoosePic(){
    try {
      const picPath = this.data.card.image[this.data.curShowPicIdx].url
      await app.goEditImagePage(picPath)
    } catch (error:any) {
      console.error(error)
      app.showNotice(this.t('choose_pic_error'))
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

  changeLikeState(e){
    this.setData({
      'card.setLike': e.detail.value
    })
    this.checkDataChange()
  },

  tapToEditTitle(){
    app.goEditContentPage(this.data.card.title)
  },

  tapToEditExtraData(){
    const c = JSON.stringify(this.data.card.info)
    const tag = this.data.tags.find(e=>e.selected && e.field)?.name || ''
    app.goEditExtraDataPage(c,tag)
  },

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
    if(originCard?.title !== editCard?.title){
      dataChange = true
    }else
    if(originCard.tags.join('') !== editCard.tags.join('')){
      dataChange = true
    }else
    if(originCard.setLike !== editCard.setLike){
      dataChange = true
    }else
    if(originCard.info.join() !== editCard.info.join()){
      dataChange = true
    }else
    if(originCard.image.length !== editCard.image.length || 
       originCard.image.map(e=>e.url).join('') !== editCard.image.map(e=>e.url).join('')){
      dataChange = true
    }

    this.setData({
      dataChange
    })
  }
})