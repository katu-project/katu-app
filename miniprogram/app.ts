import { getAppManager } from '@/class/app'

wx.cloud.init({
  env: 'dev-4gglcut52bffa0ff',
  traceUser: true,
})

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
    this.globalData.app.loadUserConfig()
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
    if(!this.globalData.app.user) return

    if(this.globalData.app.user.config?.security.rememberPassword){
      console.log('缓存主密码');
      this.globalData.app.cacheMasterKey()
    }else{
      if(this.globalData.app.user.config?.security.lockOnExit){
        console.log('退出并清除主密码');
        this.globalData.app.clearMasterKey()
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
    Custom: {},
    app: getAppManager(),
    ColorList: [{
        title: '嫣红',
        name: 'red',
        color: '#e54d42'
      },
      {
        title: '桔橙',
        name: 'orange',
        color: '#f37b1d'
      },
      {
        title: '明黄',
        name: 'yellow',
        color: '#fbbd08'
      },
      {
        title: '橄榄',
        name: 'olive',
        color: '#8dc63f'
      },
      {
        title: '森绿',
        name: 'green',
        color: '#39b54a'
      },
      {
        title: '天青',
        name: 'cyan',
        color: '#1cbbb4'
      },
      {
        title: '海蓝',
        name: 'blue',
        color: '#0081ff'
      },
      {
        title: '姹紫',
        name: 'purple',
        color: '#6739b6'
      },
      {
        title: '木槿',
        name: 'mauve',
        color: '#9c26b0'
      },
      {
        title: '桃粉',
        name: 'pink',
        color: '#e03997'
      },
      {
        title: '棕褐',
        name: 'brown',
        color: '#a5673f'
      },
      {
        title: '玄灰',
        name: 'grey',
        color: '#8799a3'
      },
      {
        title: '草灰',
        name: 'gray',
        color: '#aaaaaa'
      },
      {
        title: '墨黑',
        name: 'black',
        color: '#333333'
      },
      {
        title: '雅白',
        name: 'white',
        color: '#ffffff'
      },
    ]
  }
});
