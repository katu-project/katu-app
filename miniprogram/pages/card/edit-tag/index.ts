import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const user = getUserManager()
const app = getAppManager()

const DefaultThemeColors = app.theme.DefaultColors

Page({
  data: {
    list: [] as AnyObject[],
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
    if(!user.isOk) return
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
    app.showNotice('删除成功')
    await app.cache.deleteTags()
    this.sendChangeEvent()
  },

  async tapToSaveTag(){
    if(!user.isActive){
      return app.showActiveNotice(true)
    }
    const tagName = this.data.tempTagName
    if(app.isMp){
      await loadData(app.textContentSafetyCheck,tagName,'内容合规检查')
    }
    const res = await loadData(user.createTag, tagName)
    this.hideDialog('showDialogCreateTag')
    this.setData({
      [`list[${this.data.list.length}]`]: {name: res.name, _id: res._id}
    })
    app.showNotice('创建成功')
    await app.cache.deleteTags()
    this.sendChangeEvent()
  },

  sendChangeEvent(){
    app.emit('tagChange')
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
      const tag = this.data.list[this.data.selectedTagIdx] as ICardTag
      tag.color = selectedColor
      loadData(user.updateTag, tag).then(async ()=>{
        this.setData({
          [`list[${this.data.selectedTagIdx}].color`]: tag.color,
        })
        this.hideDialog('showDialogSetColor')
        await app.cache.deleteTags()
        this.sendChangeEvent()
      })
    }
  }
})