const { loadData, navigateTo } = require("../../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    key: '',
    tag: '',
    list: [],
    isRefresh: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
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