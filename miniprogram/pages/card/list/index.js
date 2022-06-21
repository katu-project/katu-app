const { loadData, navigateTo } = require("../../../utils/index")
const globalData = getApp().globalData
const DefaultLockImage = '/static/images/lock.svg'
const DefaultShowImage = '/static/images/image.svg'

Page({
  data: {
    DefaultLockImage,
    DefaultShowImage,
    key: '',
    tag: '',
    list: []
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

  },
  onShow() {
    loadData(globalData.app.api.getCard, {where: this.where}).then(list=>{
      this.originList = list
      this.setData({
        list
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