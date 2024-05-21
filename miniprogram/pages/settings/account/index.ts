import { loadData, showLoading } from "@/utils/index"
import { getAppManager } from '@/controller/app'
import { getUserManager } from "@/controller/user"
const app = getAppManager()
const user = getUserManager()

Page({
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
      const {cancel} = await app.showChoose('请在卡兔网页服务端操作',{cancelText:'查看帮助'})
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
    await app.showConfirm('此操作将删除用户所有数据！','删除')
    loadData(app.deleteAccount).then(()=>{
      app.showNotice('账户删除成功').then(()=>{
        app.reLaunch()
      })
    })
  },

  async tapToLogout(){
    await app.showConfirm('确认退出登录？')
    app.logout()
    await showLoading('正在退出', 2000)
    await app.showNotice('已退出登录')
    app.navigateBack()
  }
})