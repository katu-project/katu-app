import { loadData, showSuccess } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const user = getUserManager()
const app = getAppManager()

const DefaultThemeColors = app.theme.DefaultColors

Page({
  data: {
    list: [],
    tempTagName: '',
    selectedTagIdx: -1,
    tempTagColor: '',
    colors: DefaultThemeColors
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

  tapToShowCreateTag(){
    const showDialogCreateTag = () => {
      this.setData({
        showDialogCreateTag: true
      })
    }

    showDialogCreateTag()
  },

  tapToShowSetColor(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    this.setData({
      selectedTagIdx: idx,
      tempTagColor: this.data.list[idx].color || 'gray'
    })

    const showDialogSetColor = ()=> {
      this.setData({
        showDialogSetColor: true
      })
    }
    showDialogSetColor()
  },

  tapToHideDialog(e){
    this.hideDialog(e.currentTarget.dataset.key)
  },

  hideDialog(dialogKey:string){
    this.setData({
      [dialogKey]: false,
      selectedTagIdx: -1,
      tempTagName: '',
      tempTagColor: ''
    })
  },

  async tapToDeleteTag(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    const tag = this.data.list[idx]
    await app.showConfirm(`删除标签: ${tag.name}`)
    await loadData(user.deleteTag, tag._id)
    this.data.list.splice(idx,1)
    this.setData({
      list: this.data.list
    })
    showSuccess('删除成功')
    user.loadCustomTags()
    
  },

  async tapToSaveTag(){
    if(!user.isActive){
      return app.showActiveNotice()
    }
    const tagName = this.data.tempTagName
    await loadData(app.textContentSafetyCheck,tagName,'内容合规检查')
    const res = await loadData(user.createTag, tagName)
    this.hideDialog('showDialogCreateTag')
    this.setData({
      [`list[${this.data.list.length}]`]: {name: res.name, _id: res._id}
    })
    showSuccess('创建成功')
    user.loadCustomTags()
  },

  tapToSelectColor(e){
    const color = this.data.colors[parseInt(e.currentTarget.dataset.idx)].name
    this.setData({
      tempTagColor: color
    })
  },

  tapToSetColor(){
    const selectedColor = this.data.tempTagColor
    if(selectedColor && selectedColor !== this.data.list[this.data.selectedTagIdx].color) {
      const tag = this.data.list[this.data.selectedTagIdx]
      tag.color = selectedColor
      loadData(user.updateTag,tag).then(()=>{
        this.setData({
          [`list[${this.data.selectedTagIdx}].color`]: tag.color,
        })
        this.hideDialog('showDialogSetColor')
        user.loadCustomTags()
      })
    }
  }
})