const globalData = getApp().globalData
const { loadData, navigateTo } = globalData.utils

export {}

Page({
  data: {
    key: '',
    tag: '',
    list: [],
    isRefresh: false
  },
  onLoad(options) {
    this.where = {}
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
    if(this.backData && this.backData.refresh){
      this.loadData()
      this.backData.refresh = null
    }
  },
  loadData(){
    return loadData(globalData.app.api.getCard, {where: this.where}).then(list=>{
      this.originList = list
      this.setData({
        list: list.map(card=>{
          if(card.encrypted){
            card.url = globalData.app.Constant.DefaultShowLockImage
          }else{
            card.url = globalData.app.Constant.DefaultShowImage
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
          fileList: [{
            fileID: card.image[0].url
          }]
        }).then(({fileList:[file]})=>{
          const key = `list[${idx}].url`
          this.setData({
            [key]: file.tempFileURL + globalData.app.Config.imageMogr2
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