import { getAppManager } from '@/class/app'

wx.cloud.init({
  env: 'dev-4gglcut52bffa0ff',
  traceUser: true,
})

const app = getAppManager()

App({
  onLaunch: function () {
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;  
        this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
      }
    })
    app.init()
    this.checkUpdate()
  },
  checkUpdate(){
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function({hasUpdate}){
      console.log({hasUpdate})
      if(!hasUpdate) return
      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，现在更新？',
          success(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate()
            }
          }
        })
      })
    })
  },
  onUnhandledRejection(e){
    console.log(e);
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
