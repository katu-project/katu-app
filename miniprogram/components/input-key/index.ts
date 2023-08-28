import { getUserManager } from "@/controller/user";

const user = getUserManager()

Component({
  options: {
  },
  properties: {
    tips: {
      type: String,
      value: ''
    },
    show: {
      type: Boolean,
      value: false
    },
    showSubBtn: {
      type: Boolean,
      value: true
    },
    subBtnText: {
      type: String,
      value: '忘记密码'
    },
    inputMode: {
      type: String,
      value: ''
    },
    changeMode: {
      type: Boolean,
      value: true
    },
    result: {
      type: String,
      value: ''
    }
  },

  data: {
    display: false,
    key: '',
    focus: false,
    state: ''
  },

  observers:{
    'show': function(v){
      if(v){
        const inputMode = this.data.inputMode ? this.data.inputMode : (user.useMiniKey ? 'mini' : 'adv')
        this.showModal(v, inputMode);
      }else{
        if(this.data.display){
          this.hideModal()
        }
      }
    },
    'result': function(v){
      if(this.data.state === '') return
      if(v){
        this.setData({
          state: 'failed'
        })
      }
    }
  },

  methods: {
    resetData(){
      this.setData({
        focus: false,
        key: '',
        show: false,
        state: ''
      })
    },

    hideModal(){
      this.setData({
        display: false
      })
      this.resetData()
    },

    showModal(v, inputMode='mini'){
      this.setData({ 
        display: v,
        key: '',
        inputMode
      })
      this.getFocus()
    },

    tapSubBtn(){
      this.hideModal()
      this.triggerEvent('tapSubBtn')
    },

    tapToHideModal(e){
      if(e.target.dataset.mask || e.target.dataset.btn) {
        this.hideModal()
        return
      }
    },

    getFocus(){
      this.setData({ 
        focus: false 
      });
      this.setData({ 
        focus: true 
      });
    },

    advConfirm(){
      if(this.data.inputMode !== 'adv') return
      if(this.data.state === 'loading') return
      this.setData({
        state: 'loading'
      })
      setTimeout(()=>{
        this.triggerEvent('confirm', {value: this.data.key})
      },500)
    },

    tapChangeMode(){
      this.setData({ 
        key: '',
        state: '',
        inputMode: this.data.inputMode === 'adv' ? 'mini' : 'adv'
      })
    },

    checkKey(e){
      const key = e.detail.value
      if(key.length == 0){
        this.setData({
          state: '',
          key: ''
        })
        return
      }
      if(this.data.inputMode === 'adv'){
        this.setData({
          key: key
        })
      }else{
        if(key.length > 6){
          this.setData({
            key: key.slice(0,6)
          })
        }else if(key.length === 6){
          if(this.data.state === 'loading') return
          this.setData({
            state: 'loading',
            key
          })
          setTimeout(()=>{
            this.triggerEvent('confirm', {value: key})
          },500)
        }else{
          this.setData({
            key
          })
        }
      }
    }
  }
})
