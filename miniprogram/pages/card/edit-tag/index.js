const { showChoose, loadData, showSuccess, showError } = require("../../../utils/index")
const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    tempTagName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.setData({
      list: globalData.app.user.customTag
    })
  },
  onShow(){
  },
  checkInputTag(){

  },
  onUnload(){
    globalData.app.syncUserTag(this.data.list)
  },
  tapToShowAddTag(){
    this.setData({
      showInputTag: true
    })
  },
  hideModal(){
    this.setData({
      showInputTag: false
    })
  },
  tapToDeleteTag(e){
    showChoose('删除这个标签？').then(({cancel})=>{
      if(cancel) return
      const tags = this.data.list.filter(tag=>tag.name !== e.currentTarget.dataset.value.name)
      loadData(globalData.app.deleteTag, e.currentTarget.dataset.value.name).then(()=>{
        this.setData({
          list: tags
        })
        showSuccess("删除成功")
      })
    })
  },
  tapToAddTag(){
    if(this.data.list.find(tag=>tag.name === this.data.tempTagName)){
      showError("标签已经存在")
      return
    }

    this.hideModal()

    loadData(globalData.app.createTag, this.data.tempTagName).then(()=>{
      const tags = this.data.list.concat({name:this.data.tempTagName})
      this.setData({
        list: tags,
        tempTagName: ''
      })
      showSuccess("创建成功")
    })
  }
})