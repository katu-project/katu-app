const globalData = getApp().globalData
import { showChoose, loadData, showSuccess, showError, switchTab } from '@/utils/index'

export {}

Page({
  data: {
    list: [],
    tempTagName: '',
    tempTagColor: '',
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
      selectedTagIdx: -1,
      tempTagName: '',
      tempTagColor: ''
    })
  },
  tapToDeleteTag(e){
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
    if(!this.data.tempTagName){
      showError("请输入名字")
      return
    }

    if(!globalData.app.user || !globalData.app.user.isActive){
      return showChoose("警告","账户未激活，不可使用此功能。", {confirmText:'去激活'}).then(({cancel})=>{
        if(cancel) return
        switchTab('../../profile/index')
      })
    }

    if(this.data.list.find(tag=>tag.name === this.data.tempTagName)){
      showError("标签已经存在")
      return
    }
    const tagName = this.data.tempTagName
    this.hideModal({currentTarget:{dataset:{key:'showCreateTag'}}})

    const tags = this.data.list.concat({name: tagName})
    this.setData({
      list: tags,
      hasEdit: true
    })
  },
  async syncTag(){
    return loadData(globalData.app.api.updateTag, this.data.list).then(()=>{
      globalData.app.syncUserTag(this.data.list)
    })
  },
  tapToShowSetColor(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    this.setData({
      selectedTagIdx: idx,
      tempTagColor: this.data.list[idx].color
    })
    this.showSetColor()
  },
  tapToSelectColor(e){
    const color = this.data.colors[parseInt(e.currentTarget.dataset.idx)].name
    this.setData({
      tempTagColor: color
    })
  },
  tapToSetColor(){
    if(this.data.tempTagColor && this.data.tempTagColor !== this.data.list[this.data.selectedTagIdx].color) {
      const key = `list[${this.data.selectedTagIdx}].color`
      this.setData({
        hasEdit: true,
        [key]: this.data.tempTagColor
      })
    }
    this.hideSetColor()
  },
  showSetColor(){
    this.setData({
      showSetColor: true
    })
  },
  hideSetColor(){
    this.setData({
      tempTagColor: '',
      showSetColor: false,
      selectedTagIdx: -1
    })
  },
  tapToBack(){
    if(JSON.stringify(globalData.app.user.customTag) === JSON.stringify(this.data.list)){
      return wx.navigateBack()
    }
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