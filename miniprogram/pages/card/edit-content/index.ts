import { navigateBack } from '@/utils/index'

export {}

Page({
  returnContentKey: '',
  data: {
    content: ''
  },
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    if(options.value){
      this.setData({
        content: options.value
      })
    }
  },
  checkContent(){

  },
  tapToSetContent(){
    navigateBack({backData:{[this.returnContentKey]: this.data.content}})
  }
})