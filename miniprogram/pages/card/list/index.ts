import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getCardManager } from '@/controller/card'
import { getUserManager } from '@/controller/user'
import { CreateEventBehavior } from '@/behaviors/event'

const app = getAppManager()
const user = getUserManager()
const cardManager = getCardManager()

app.createPage({
  i18n: {
    page: ['cardList']
  },

  where: { tag: '' },
  originList: [] as AnyObject[],
  
  behaviors: [
    CreateEventBehavior('list')
  ],

  data: {
    key: '',
    tag: '',
    list: [] as AnyObject[],
    tagsInfo: {} as AnyObject,
    isRefresh: false,
    layout: 'default'
  },

  onLoad(options) {
    if(options.tag){
      this.where.tag = options.tag
    }
  },

  onReady() {
    const { tag:useTag } = this.where
    if(useTag){
      const appTag = app.getCardConfig('defaultTags').find(e=>e.name === useTag)
      const setData = {
        tag: appTag?.default ? app.t(useTag,[],'tag') : useTag
      }
      if(appTag?.layout) setData['layout'] = appTag.layout
      this.setData(setData)
    }
    this.loadData()
  },

  onShow() {
  },

  async loadData(){
    if(!user.isOk) return
    this.loadTagsInfo()
    const list = await loadData(cardManager.getList, {where: this.where})
    this.originList = list
    this.setData({ list })
    this.loadCardImage()
  },

  async loadTagsInfo(){
    const tags = (user.config?.general.useDefaultTag ? app.getCardConfig('defaultTags') : []).concat(await user.getTags())
    const tagsInfo = {}
    tags.map(e=>{
      tagsInfo[e.name] = {
        label: e?.default ? app.t(e.name,[],'tag') : e.name,
        color: e?.default ? '' : e.color
      }
    })
    this.setData({
      tagsInfo: tagsInfo
    })
  },

  onEventCardDelete(card){
    const idx = this.data.list.findIndex(e=>e._id === card._id)
    if(idx>=0){
      this.data.list.splice(idx,1)
      this.setData({
        list: this.data.list
      })
    }
  },

  onEventCardChange(card){
    console.log('list page: onEventCardChange:', card._id, card.title)
    const idx = this.data.list.findIndex(e=>e._id === card._id)
    if(idx>=0){
      const setData = {}
      const originCard = this.data.list[idx]
      if(originCard.title !== card.title){
        setData[`list[${idx}].title`] = card.title
      }
      if(originCard.tags.toString() !== card.tags.toString()){
        setData[`list[${idx}].tags`] = card.tags
      }
      if(originCard.setLike !== card.setLike){
        setData[`list[${idx}].setLike`] = card.setLike
      }
      // image change
      if(originCard.image[0].hash !== card.image[0].hash){
        setData[`list[${idx}].image`] = card.image
        setData[`list[${idx}]._url`] = app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      }
      if(Object.keys(setData).length) this.setData(setData)
      this.loadCardImage(card, idx)
    }
  },

  onEventCardDecrypt(card){
    return this.onEventCardChange(card)
  },

  onEventCardHide(id){
    const idx = this.data.list.findIndex(e=>e._id === id)
    const findCard = this.data.list[idx] as ICard
    console.log('list page: onEventCardHide:', id, findCard.title)
    if(findCard){
      this.loadCardImage(findCard, idx)
    }
  },

  async loadCardImage(card?:ICard, idx?:number){
    const listKey = 'list'
    if(card){
      const setData = await cardManager.getImageRenderSetData({idx:idx!, card, keyName:listKey})
      if(Object.keys(setData).length) this.setData(setData)
    }else{
      const advSetData = app.createAdvSetData(this.setData.bind(this), this.data.list.length)
      for (const idx in this.data.list) {
        const card = this.data.list[idx] as ICard
        cardManager.getImageRenderSetData({idx, card, keyName:listKey})
                   .then(advSetData)
      }
    }
  },

  onBindRefresh(){
    this.setData({
      isRefresh: true,
      key: ''
    })
    this.loadData().then(()=>{
      this.setData({
        isRefresh: false
      })
    })
  },

  tapToCopyValue(e){
    const idx = e.currentTarget.dataset.idx
    if(!this.data.list[idx].cn){
      app.showNotice(this.data.list[idx].cnText)
      return
    }
    app.copyText(this.data.list[idx].cn)
  },
  
  async tapToCardDetail(e){
    await app.checkQuotaNotice()
    app.goCardDetailPage(e.currentTarget.dataset.key)
  },

  tapToCloseFilter(){
    this.setData({
      key: ''
    })
    this.resetData()
  },

  resetData(){
    this.setData({
      list: this.originList
    })
  },

  inputSearch(e){
    const key = e.detail.value
    if(!key){
      this.resetData()
    }else{
      this.setData({
        list: this.data.list.filter(e=>e.title.includes(key))
      })
    }
  },
})