import { createAdvSetData, loadData, navigateTo } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getCardManager } from '@/controller/card'
const app = getAppManager()
const cardManager = getCardManager()

Page({
  where: {},
  originList: [],
  data: {
    key: '',
    tag: '',
    list: [],
    isRefresh: false
  },

  onLoad(options) {
    if(options.tag){
      this.where = {tag: options.tag}
      this.setData({
        tag: options.tag
      })
    }
    this.subscribeEvents()
  },

  onUnload(){
    app.off('cardDelete',this.onEventCardDelete)
    app.off('cardChange',this.onEventCardChange)
    app.off('cardDecrypt',this.onEventCardChange)
    app.off('cardHide',this.onEventCardHide)
  },

  onReady() {
    this.loadData()
  },

  onShow() {
  },

  async loadData(){
    const list = await loadData(cardManager.getList, {where: this.where})
    this.originList = list
    this.setData({ list })
    this.loadCardImage()
  },

  subscribeEvents(){
    app.on('cardDelete',this.onEventCardDelete)
    app.on('cardChange',this.onEventCardChange)
    app.on('cardDecrypt',this.onEventCardChange)
    app.on('cardHide',this.onEventCardHide)
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
      if(originCard.image[0].hash !== card.image[0].hash){
        setData[`list[${idx}].image`] = card.image
        setData[`list[${idx}]._url`] = app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      }
      if(Object.keys(setData).length) this.setData(setData)
      this.loadCardImage(card, idx)
    }
  },

  onEventCardHide(id){
    const idx = this.data.list.findIndex(e=>e._id === id)
    const findCard = this.data.list[idx]
    console.log('list page: onEventCardHide:', id, findCard.title)
    if(findCard){
      const setData = {}
      setData[`list[${idx}]._url`] = app.getConst('DefaultShowLockImage')
      setData[`list[${idx}]._showEncryptIcon`] = false
      this.setData(setData)
    }
  },

  async loadCardImage(card?:ICard, idx?:number){
    if(card){
      const setData = await cardManager.getImageRenderSetData({idx:idx!, card, keyName:'list'})
      if(Object.keys(setData).length) this.setData(setData)
    }else{
      const advSetData = createAdvSetData(this.setData.bind(this), this.data.list.length)
      for (const idx in this.data.list) {
        const card = this.data.list[idx]
        cardManager.getImageRenderSetData({idx, card, keyName:'list'})
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

  tapToCardDetail(e){
    navigateTo(`../detail/index?id=${e.currentTarget.dataset.key}`)
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