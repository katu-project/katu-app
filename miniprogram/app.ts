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
    app.loadUserConfig()
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
  onHide(){
    if(!app.user) return

    if(app.user.config?.security.rememberPassword){
      console.log('缓存主密码');
      app.cacheMasterKey()
    }else{
      if(app.user.config?.security.lockOnExit){
        console.log('退出并清除主密码');
        app.clearMasterKey()
      }
    }

  },
  onPageNotFound({path}){
    console.log(`运行异常: 页面未找到-${path}`);
    wx.reLaunch({
      url: 'pages/home/index',
    })
  },
  onUnhandledRejection(e){
    console.log(e);
  },
  globalData: {
    StatusBar: 0,
    CustomBar: 0,
    Custom: {}
  }
});
