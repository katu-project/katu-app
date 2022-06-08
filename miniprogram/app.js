const { getAppManager } = require('class/app')
App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'dev-4gglcut52bffa0ff',
      traceUser: true,
    });
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;  
        this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
      }
    })
    getAppManager().then(app=>{
      this.globalData.app = app
    })
  },
  globalData: {}
});
