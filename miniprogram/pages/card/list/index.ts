import api from '@/api'
import { loadData, navigateTo } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()

export {}

Page({
  backData: {
    refresh: false
  },
  where: {},
  originList: [] as Card[],
  data: {
    key: '',
    tag: '',
    list: [] as Card[],
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
            card._url = app.Constant.DefaultShowLockImage
          }else{
            card._url = app.Constant.DefaultShowImage
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
        wx.cloud.getTempFileURL({
          fileList: [card.image[0].url]
        }).then(({fileList:[file]})=>{
          const key = `list[${idx}].url`
          this.setData({
            [key]: file.tempFileURL + app.Config.imageMogr2
          })
        })
      }
    }
  },
  onBindRefresh(){
    this.setData({
      isRefresh: true
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