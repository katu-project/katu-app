import { getAppManager } from '@/class/app'
import { navigateBack } from '@/utils/index'
const app = getAppManager()

Page({
  data: {
    content: ''
  },
  onLoad(options) {
    if(options.value){
      this.setData({
        content: options.value
      })
    }
  },
  checkContent(){

  },
  tapToSetContent(){
    app.emit('setCardTitle',this.data.content.trim())
    navigateBack()
  }
})