const { showChoose, loadData, showSuccess, showError } = require("../../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    list: [],
    tempTagName: '',
    hasEdit: false,
    colors: globalData.ColorList
  },
  onReady() {
    
  },
  onShow(){
    this.setData({
      list: globalData.app.user.customTag
    })
  },
  checkInputTag(){

  },
  tapToShowAddTag(){
    this.setData({
      showCreateTag: true
    })
  },
  hideModal(e){
    const key = e.currentTarget.dataset.key
    this.setData({
      [key]: false,
      selectedTagIdx: -1
    })
  },
  tapToDeleteTag(e){
    if(this.data.showSetColor) {
      this.setData({
        selectedTagIdx: parseInt(e.currentTarget.dataset.idx)
      })
      return
    }
    showChoose('删除这个标签？').then(({cancel})=>{
      if(cancel) return
      this.data.list.splice(parseInt(e.currentTarget.dataset.idx),1)
      this.setData({
        list: this.data.list,
        hasEdit: true
      })
    })
  },
  tapToAddTag(){
    if(this.data.list.find(tag=>tag.name === this.data.tempTagName)){
      showError("标签已经存在")
      return
    }
    this.hideModal({currentTarget:{dataset:{key:'showCreateTag'}}})

    const tags = this.data.list.concat({name:this.data.tempTagName})
    this.setData({
      list: tags,
      hasEdit: true,
      tempTagName: ''
    })
  },
  async syncTag(){
    return loadData(globalData.app.api.updateTag, this.data.list).then(()=>{
      globalData.app.syncUserTag(this.data.list)
    })
  },
  tapToShowSetColor(e){
    this.setData({
      selectedTagIdx: parseInt(e.currentTarget.dataset.idx)
    })
    if(this.data.showSetColor) return
    this.showSetColor()
  },
  tapToSetColor(e){
    const color = this.data.colors[parseInt(e.currentTarget.dataset.idx)].name
    const key = `list[${this.data.selectedTagIdx}].color`
    this.setData({
      hasEdit: true,
      [key]: color
    })
  },
  showSetColor(){
    this.setData({
      showSetColor: true
    })
  },
  tapToBack(){
    if(!this.data.hasEdit) {
      wx.navigateBack()
      return
    }
    showChoose('保存修改?').then(({cancel})=>{
      if(cancel){
        wx.navigateBack()
      }else{
        this.syncTag().then(()=>{
          this.setData({
            hasEdit: false
          })
          showSuccess("修改成功")
          setTimeout(()=>this.tapToBack(), 500)
        })
      }
    })
  }
})