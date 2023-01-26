import api from '@/api'
import { createAdvSetData, loadData, navigateTo } from '@/utils/index'
import { DefaultShowImage, DefaultShowLockImage } from '@/const'
import { getAppManager } from '@/class/app'
import { getCardManager } from '@/class/card'
const app = getAppManager()
const cardManager = getCardManager()

Page({
  where: {},
  originList: [] as ICard[],
  data: {
    key: '',
    tag: '',
    list: [] as ICard[],
    isRefresh: false
  },
  onLoad(options) {
    if(options.tag){
      this.where = {tag: options.tag}
      this.setData({
        tag: options.tag
      })
    }
    app.on('cardDelete',this.onEventCardDelete)
    app.on('cardChange',this.onEventCardChange)
    app.on('cardDecrypt',this.onEventCardChange)
  },
  onUnload(){
    app.off('cardDelete',this.onEventCardDelete)
    app.off('cardChange',this.onEventCardChange)
    app.off('cardDecrypt',this.onEventCardChange)
  },
  onReady() {
    this.loadData()
  },
  onShow() {
  },
  loadData(){
    return loadData(api.getCardList, {where: this.where}).then(list=>{
      this.originList = list
      this.setData({
        list: list.map(card=>{
          if(card.encrypted){
            card._url = DefaultShowLockImage
          }else{
            card._url = DefaultShowImage
          }
          return card
        })
      })
      this.loadCardImage()
    })
  },
  onEventCardDelete(id){
    const idx = this.data.list.findIndex(e=>e._id === id)
    if(idx>=0){
      this.data.list.splice(idx,1)
      this.setData({
        list: this.data.list
      })
    }
  },
  onEventCardChange(card){
    console.log('list page: update card info:', card._id, card.title)
    const idx = this.data.list.findIndex(e=>e._id === card._id)
    if(idx>=0){
      console.log('list page: update card info:', card._id, card.title);
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
        setData[`list[${idx}]._url`] = card.encrypted ? DefaultShowLockImage : DefaultShowImage
      }
      this.setData(setData)
      this.loadCardImage(card, idx)
    }
  },
  async loadCardImage(card?:ICard, idx?:number){
    if(card){
      this.setData(await cardManager.getImageRenderSetData(idx!, card, 'list'))
    }else{
      const advSetData = createAdvSetData(this.setData.bind(this), this.data.list.length)
      for (const idx in this.data.list) {
        const card = this.data.list[idx]
        cardManager.getImageRenderSetData(idx, card, 'list').then(setData=>{
          advSetData(setData)
        })
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