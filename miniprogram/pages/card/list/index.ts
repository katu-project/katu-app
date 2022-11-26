import api from '@/api'
import { loadData, navigateTo } from '@/utils/index'
import { DefaultShowImage, DefaultShowLockImage } from '@/const'
import { getAppManager } from '@/class/app'
const app = getAppManager()

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
  },
  onReady() {
    this.loadData()
  },
  onShow() {
    if(this.backData.refresh){
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
  loadImage(){
    for (const idx in this.data.list) {
      const card = this.data.list[idx]
      if(!card.encrypted){
        app.getCloudFileTempUrl(card.image[0].url).then( tempUrl =>{
          const setData = {}
          if(tempUrl.startsWith('/')){
            setData[`list[${idx}]._url`] = tempUrl
            setData[`list[${idx}]._mode`] = 'scaleToFill'
          }else{
            setData[`list[${idx}]._url`] = tempUrl + app.Config.imageMogr2
          }
          this.setData(setData)
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