import '@/utils/override'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

App({
  onLaunch(){
    const baseInfo = wx.getAppBaseInfo()
    app.initI18n(baseInfo.language)
    this.i18n = app.i18n
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
    state: []
  },
  
  i18n: {}
});
