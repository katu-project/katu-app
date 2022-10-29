import { showError } from "@/utils/index"

Component({
  options: {
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },
  data: {
    display: false,
    key: '',
    dataLength: ''
  },
  observers:{
    'show': function(v){
      this.setData({
        display: v,
        key: ''
      })
    }
  },
  methods: {
    async tapToSetKey(){
      if(!this.data.key) {
        showError("输入有误")
        return
      }
      this.setData({
        display: false
      })
      this.triggerEvent('confirm', {value: this.data.key})
    },
    checkKey(){},
    hideModal(){
      this.setData({
        show: false,
        key: ''
      })
    }
  }
})
