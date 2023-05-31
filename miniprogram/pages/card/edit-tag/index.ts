import { showChoose, loadData, showError, showSuccess } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const user = getUserManager()
const app = getAppManager()

Page({
  data: {
    list: [] as ICardTag[],
    tempTagName: '',
    selectedTagIdx: -1,
    tempTagColor: '',
    colors: app.tagColorList
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
          showSuccess('删除成功')
          user.loadCustomTags()
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
      return app.showActiveNotice()
    }

    const tagName = this.data.tempTagName

    if(this.data.list.find(tag=>tag.name === tagName)){
      showError("标签已经存在")
      return
    }

    if(user.config?.general.useDefaultTag && app.defaultUsableTag.find(tag=>tag.name === tagName)){
      showError("内置标签已存在")
      return
    }

    const {checkPass} = await loadData(app.textContentsafetyCheck,tagName,'内容检查')
    if(!checkPass){
      throw new Error("数据似乎存在不适内容")
    }

    const res = await loadData(user.createTag, {name:tagName})
    this.hideModal({currentTarget:{dataset:{key:'showCreateTag'}}})
    this.setData({
      [`list[${this.data.list.length}]`]: {name: res.name, _id: res._id}
    })
    showSuccess('创建成功')
    user.loadCustomTags()
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
        user.loadCustomTags()
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