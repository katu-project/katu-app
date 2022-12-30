import { showChoose, loadData, showSuccess, showError, switchTab } from '@/utils/index'
import { getUserManager } from '@/class/user'
import { ColorList } from '@/const'

const user = getUserManager()

Page({
  data: {
    list: [] as ICardTag[],
    tempTagName: '',
    selectedTagIdx: -1,
    tempTagColor: '',
    colors: ColorList
  },
  onReady() {
    
  },
  onShow(){
    this.loadData()
  },
  loadData(){
    this.setData({
      list: user.tags
    })
  },
  checkInputTag(){

  },
  syncTags(){
    loadData(user.syncTag, this.data.list, {returnFailed: true}).then(()=>{
      showSuccess("操作成功")
    }).catch(err=>{
      showError(err.message)
    }).finally(()=>{
      this.loadData()
    })
  },
  tapToShowAddTag(){
    this.setData({
      showCreateTag: true
    })
  },
  hideModal(e){
    const modalKey = e.currentTarget.dataset.key
    this.setData({
      [modalKey]: false,
      selectedTagIdx: -1,
      tempTagName: '',
      tempTagColor: ''
    })
  },
  tapToDeleteTag(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    const tag = this.data.list[idx]
    showChoose('删除这个标签？', tag.name).then(({cancel})=>{
      if(cancel) return
      this.data.list.splice(idx,1)
      this.syncTags()
    })
  },
  async tapToAddTag(){
    if(!this.data.tempTagName){
      showError("请输入名字")
      return
    }

    if(!user.isActive){
      await showChoose("警告","账户未激活，不可使用此功能。", {confirmText:'去激活'}).then(({cancel})=>{
        if(cancel) return
        switchTab('../../profile/index')
      })
      return
    }

    if(this.data.list.find(tag=>tag.name === this.data.tempTagName)){
      showError("标签已经存在")
      return
    }
    const tagName = this.data.tempTagName
    this.hideModal({currentTarget:{dataset:{key:'showCreateTag'}}})

    this.data.list.push({name: tagName})
    this.syncTags()
  },
  tapToShowSetColor(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    this.setData({
      selectedTagIdx: idx,
      tempTagColor: this.data.list[idx].color || 'gray'
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
      this.data.list[this.data.selectedTagIdx].color = this.data.tempTagColor
      this.syncTags()
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
  }
})