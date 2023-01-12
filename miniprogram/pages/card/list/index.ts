import api from '@/api'
import { loadData, navigateTo } from '@/utils/index'
import { DefaultShowImage, DefaultShowLockImage } from '@/const'
import { getAppManager } from '@/class/app'
import { getCardManager } from '@/class/card'
const app = getAppManager()
const cardManager = getCardManager()
export {}

Page({
  backData: {
    refresh: false
  },
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
    app.on('cardDelete',this.cardDeleteSilentRefresh)
    app.on('cardChange',this.silentRefresh)
    app.on('cardDecrypt',this.silentRefresh)
  },
  onUnload(){
    app.off('cardDelete',this.cardDeleteSilentRefresh)
    app.off('cardChange',this.silentRefresh)
    app.off('cardDecrypt',this.silentRefresh)
  },
  onReady() {
    this.loadData()
  },
  onShow() {
    if(this.backData?.refresh){
      this.loadData()
      this.backData.refresh = false
    }
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
      this.loadImage()
    })
  },
  cardDeleteSilentRefresh(id){
    const idx = this.data.list.findIndex(e=>e._id === id)
    if(idx>=0){
      this.data.list.splice(idx,1)
      this.setData({
        list: this.data.list
      })
    }
  },
  silentRefresh(card){
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
      this.loadImage(card)
    }
  },
  async loadImage(card?:ICard){
    const setData = {}

    const renderImage = async (idx,card:ICard)=>{
      const setData = {}
      if(card.encrypted){
        if(app.user.config?.general.autoShowContent){
          try {
            const picPath = await cardManager.getCardImagePathCache(card.image[0])
            setData[`list[${idx}]._url`] = picPath
            setData[`list[${idx}]._showEncryptIcon`] = true
          } catch (error) {}
        }
      }else{
        const tempUrl = await app.getCloudFileTempUrl(card.image[0].url)
        if(tempUrl.startsWith('/')){
          setData[`list[${idx}]._url`] = tempUrl
          setData[`list[${idx}]._mode`] = 'scaleToFill'
        }else{
          setData[`list[${idx}]._url`] = tempUrl + app.Config.imageMogr2
        }
      }
      return setData
    }

    if(card){
      let idx = this.data.list.findIndex(e=>e._id === card._id)
      if(idx === -1){
        console.log('不应该进入这里,',card)
        return
      }
      Object.assign(setData, await renderImage(idx, card))
    }else{
      for (const idx in this.data.list) {
        const card = this.data.list[idx]
        Object.assign(setData, await renderImage(idx, card))
      }
    }
    this.setData(setData)
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
  tapToCloseFilter(e){
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