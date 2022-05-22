const { getAppManager } = require('./class/app')

App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'dev-4gglcut52bffa0ff',
      traceUser: true,
    });

    getAppManager().then(app=>{
      this.globalData.app = app
      this.globalData.user = app.user
    })
  },
  globalData: {
    user: null
  }
});
