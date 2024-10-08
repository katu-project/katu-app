import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  originValue: '',
  data: {
    content: '',
    dataChange: false
  },
  
  onLoad(options) {
    if(options.value){
      this.originValue = options.value
      this.setData({
        content: options.value
      })
    }
  },

  onBindInput(e){
    const content = e.detail.value.trim()
    this.setData({
      dataChange: this.originValue !== content,
      content
    })
  },

  tapToSetContent(){
    app.publishCardEditTitleEvent(this.data.content.trim())
    app.navigateBack()
  }
})