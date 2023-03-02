import { loadData, navigateTo, showChoose } from "@/utils/index"

import { getAppManager } from '@/class/app'
import { getUserManager } from "@/class/user"
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
    if(user.id){
      setData['userId'] = user.id
    }
    setData['userTel'] = user.tel ? user.tel.replace(/^(\d{3}).*(\d{4})$/,'$1****$2') : ''
    this.setData(setData)
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(`./${page}/index`)
  },
  tapToDeleteAccount(){
    showChoose('警告','此操作将删除用户所有数据！',{
      confirmText: '删除',
      confirmColor: '#FF0000',
    }).then(({confirm})=>{
      if(confirm) {
        loadData(app.deleteAccount).then(()=>{
          showChoose('操作成功','账户删除成功',{
            showCancel: false
          }).then(()=>{
            app.reLaunch()
          })
        })
      }
    })
  }
})