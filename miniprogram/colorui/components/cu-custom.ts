const app = getApp()

Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  properties: {
    bgColor: {
      type: String,
      default: ''
    },
    backColor: {
      type: String,
      default: ''
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    isBack: {
      type: Boolean,
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
  },
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom
  },
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      }).catch(()=>{
        this.toHome()
      })
    },
    toHome(){
      wx.reLaunch({
        url: `/pages/home/index`,
      })
    }
  }
})