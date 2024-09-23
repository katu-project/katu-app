import { getAppManager } from "@/controller/app"
import { getUserManager } from "@/controller/user"
import { appleLogin, loadData, showLoading, weixinMiniProgramLogin } from "@/utils/index"
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    logins: {
      apple: {
        enable: false
      },
      mp: {
        enable: false
      }
    }
  },

  async onLoad(){
    this.renderData()
  },

  async renderData(){
    this.setData({
      logins: user.config?.security.logins
    })
  },

  async tapToConfig(e){
    const enable = e.detail.value
    const type = e.currentTarget.dataset.key
    if(user.config?.security.logins[type]?.enable === enable) {
      app.showMiniNotice('已'+ (enable ? '启用' : '取消'))
      return
    }
    if(enable){
      let code = ''
      const hideLoading = await showLoading('等待授权', -1, false)
      try {
        if(type === 'apple') code = await appleLogin()
        if(type === 'mp') {
          const hasInstall = await app.hasInstallWechat()
          if(!hasInstall){
            throw Error('未安装微信')
          }
          code = await weixinMiniProgramLogin()
        }
        if(!code) throw Error('绑定出错了')
      } catch (err:any) {
        await hideLoading()
        console.error('bind other login:', err)
        this.setData({
          [`logins.${type}.enable`]: false
        })
        if(err.message){
          await app.showNotice(err.message)
        }else{
          await app.showMiniNotice('授权失败')
        }
        return
      }

      await hideLoading()
      loadData(app.bindOtherLoginByCode, code, {
        loadingTitle: '正在绑定账户',
        returnFailed: true
      }).then(async ()=>{
        app.showMiniNotice("绑定成功")
        await user.reloadInfo()
      }).catch(()=>{
      }).finally(()=>{
        this.renderData()
      })
    }else{
      const { confirm } = await app.showChoose('确认取消绑定？')
      if(!confirm){
        await this.renderData()
        return
      }else{
        loadData(app.unbindOtherLogin, type, {
          returnFailed: true
        }).then(async ()=>{
          app.showMiniNotice("已取消绑定")
          await user.reloadInfo()
        }).catch(()=>{
        }).finally(()=>{
          this.renderData()
        })
      }
    }
  }
})