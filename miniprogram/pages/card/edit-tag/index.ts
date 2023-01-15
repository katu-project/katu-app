import { showChoose, loadData, showError, switchTab } from '@/utils/index'
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
  async loadData(){
    const tags = await loadData(user.getTags)
    this.setData({
      list: tags
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
    showChoose('删除这个标签？', tag.name).then(({confirm})=>{
      if(confirm){
        loadData(user.deleteTag, tag._id).then(()=>{
          this.data.list.splice(idx,1)
          this.setData({
            list: this.data.list
          })
        })
      }
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

    const res = await loadData(user.createTag, {name:tagName})
    this.hideModal({currentTarget:{dataset:{key:'showCreateTag'}}})
    this.setData({
      [`list[${this.data.list.length}]`]: {name: res.name, _id: res._id}
    })
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
      const tag = this.data.list[this.data.selectedTagIdx]
      tag.color = this.data.tempTagColor
      loadData(user.updateTag,tag).then(()=>{
        this.setData({
          [`list[${this.data.selectedTagIdx}].color`]: tag.color
        })
        this.hideSetColor()
      })
    }
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