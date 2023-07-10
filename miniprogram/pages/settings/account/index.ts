import { loadData } from "@/utils/index"
import { getAppManager } from '@/controller/app'
import { getUserManager } from "@/controller/user"
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    userId: '',
    userTel: '',
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
    this.setData(setData)
  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  },

  async tapToDeleteAccount(){
    await app.showConfirm('此操作将删除用户所有数据！','删除')
    loadData(app.deleteAccount).then(()=>{
      app.showNotice('账户删除成功').then(()=>{
        app.reLaunch()
      })
    })
  }
})