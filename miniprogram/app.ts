import '@/utils/override'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

App({
  onLaunch: function () {
    wx.getSystemInfo({
      success: info => {
        this.globalData.StatusBar = info.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;  
        this.globalData.CustomBar = custom.bottom + custom.top - info.statusBarHeight;
        app.init(info)
      }
    })
  },

  onUnhandledRejection(e){
    console.error('app onUnhandledRejection: ', e);
  },

  onError(e){
    console.error('App on err', e)
  },
  
  globalData: {
    StatusBar: 0,
    CustomBar: 0,
    Custom: {},
    state: {
      inPreviewPic: false,
      inChooseLocalImage: false,
      inShareData: false
    }
  }
});
