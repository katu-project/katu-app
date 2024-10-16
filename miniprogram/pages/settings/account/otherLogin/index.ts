import { getAppManager } from "@/controller/app"
import { getUserManager } from "@/controller/user"
import { appleLogin, loadData, showLoading, weixinMiniProgramLogin } from "@/utils/index"
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','otherLogin']
  },

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
    // value sync
    if(user.config?.security.logins[type]?.enable === enable) {
      app.showMiniNotice(enable ? this.t('config_success') : this.t('cancel_success'))
      return
    }

    this.setData({
      [`logins.${type}.enable`]: !enable
    })

    if(enable){
      let code = ''

      if(type === 'mp'){
        const hasInstall = await app.hasInstallWechat()
        if(!hasInstall){
          await app.showNotice(this.t('not_install_wx'))
          return
        }
      }

      const hideLoading = await showLoading(this.t('wait_auth'), -1, false)
      try {
        if(type === 'apple') code = await appleLogin()
        if(type === 'mp') code = await weixinMiniProgramLogin()
        if(!code) throw Error('error 400')
      } catch (err:any) {
        await hideLoading()
        console.error('bind other login:', err)
        await app.showMiniNotice(this.t('auth_failed'))
        return
      }

      await hideLoading()
      loadData(app.bindOtherLoginByCode, code, {
        loadingTitle: this.t('in_bind_account'),
        returnFailed: true
      }).then(async ()=>{
        app.showMiniNotice(this.t('config_success'))
        await user.reloadInfo()
      }).catch(()=>{
      }).finally(()=>{
        this.renderData()
      })
    }else{
      const { confirm } = await app.showChoose(`${this.t('cancel_bind')}?`)
      if(!confirm){
        return
      }else{
        loadData(app.unbindOtherLogin, type, {
          returnFailed: true
        }).then(async ()=>{
          app.showMiniNotice(this.t('cancel_success'))
          await user.reloadInfo()
        }).catch(()=>{
        }).finally(()=>{
          this.renderData()
        })
      }
    }
  }
})