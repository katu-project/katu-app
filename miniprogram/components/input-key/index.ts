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
      value: 'mini'
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
        this.showModal(v);
      }else{
        this.hideModal()
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
        state: ''
      })
    },

    hideModal(){
      this.setData({
        display: false
      })
      this.resetData()
    },

    showModal(v){
      this.setData({ 
        display: v,
        key: '',
        focus: true
      })
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
      this.resetData()
      this.setData({ 
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
