import { loadData, showChoose } from "@/utils/index"

import { getAppManager } from '@/class/app'
const app = getAppManager()

Page({
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