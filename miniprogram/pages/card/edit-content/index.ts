import { getAppManager } from '@/class/app'
import { navigateBack } from '@/utils/index'
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
    app.emit('setCardTitle',this.data.content.trim())
    navigateBack()
  }
})