const { loadData, navigateTo, showChoose } = require("../../utils/index")
const globalData = getApp().globalData

Component({
  options: {
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    display: false,
    key: ''
  },
  observers:{
    'show': function(v){
      this.setData({
        display: v
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async tapToSetKey(){
      const {app:{user}} = globalData
      if(!user.setMasterKey) {
        await showChoose("警告","未设置主密码",{confirmText:'去设置'})
        navigateTo('/pages/settings/security/master-key/index')
        return
      }
      await loadData(globalData.app.checkSetAndReloadMasterKey, this.data.key,'验证中')

      this.setData({
        display: false
      })
    },
    checkKey(){
      // console.log(this.data.key);
    },
    hideModal(){
      this.setData({
        show: false,
        key: ''
      })
    }
  }
})
