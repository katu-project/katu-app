const app = getApp()
import { APP_ENTRY_PATH } from '@/const'

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
      }).catch(e=>{
        this.toHome()
      })
    },
    toHome(){
      wx.reLaunch({
        url: APP_ENTRY_PATH,
      })
    }
  }
})