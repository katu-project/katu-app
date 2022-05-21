App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'dev-4gglcut52bffa0ff',
      traceUser: true,
    });
  },
  globalData: {
    user: null
  }
});
