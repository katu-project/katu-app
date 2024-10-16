import { loadData, showLoading } from "@/utils/index"
import { getAppManager } from '@/controller/app'
import { getUserManager } from "@/controller/user"
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','account']
  },

  data: {
    userId: '',
    userTel: '',
    userEmail: ''
  },

  onShow(){
    this.loadData()
  },

  loadData(){
    const setData = {}
    if(user.uid){
      setData['userId'] = user.uid
    }
    setData['userTel'] = user.tel ? user.tel.replace(/^(\d{3}).*(\d{4})$/,'$1****$2') : ''
    setData['userEmail'] = user.email || ''

    this.setData(setData)
  },

  async tapToPage({currentTarget:{dataset:{page}}}){
    if(['bind-tel','bind-email'].includes(page) ){
      const {cancel} = await app.showChoose(this.t('do_on_web'),{cancelText: this.t('go_help')})
      if(cancel){
        app.openBindTelDoc()
      }
      return
    }
    if(page === 'uid-info'){
      app.openUidInfoDoc()
      return
    }
    app.goToPage(page)
  },

  async tapToDeleteAccount(){
    await app.showConfirm(`${this.t('delete_account_warn')}!`)
    loadData(app.deleteAccount).then(()=>{
      app.showNotice(this.t('delete_success')).then(()=>{
        app.reLaunch()
      })
    })
  },

  async tapToLogout(){
    await app.showConfirm(`${this.t('sign_out')}?`)
    app.logout()
    await showLoading(this.t('in_logout'), 2000)
    await app.showNotice(this.t('logout_ok'))
    app.reLaunch()
  }
})