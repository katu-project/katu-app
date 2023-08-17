import { loadData } from '@/utils/index'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
const user = getUserManager()
const app = getAppManager()

Page({
  data: {
    list: [],
    quota: {
      remain: 0
    },
    code: ''
  },
  
  onReady(){
    this.loadData()
  },

  onShow(){
  },

  loadData(){
    this.setData({
      'quota.remain': user.quota
    })
    loadData(user.getQuotaLog).then(logs=>{
      const setData = {}
      setData['list'] = logs.map(e=>{
        e['time'] = new Date(e.createTime).toLocaleDateString(undefined,{ month: '2-digit', day: '2-digit', year: 'numeric'})
        return e
      })
      this.setData(setData)
    })
  },
  onCodeInput(){

  },

  tapToExchange(){
    this.hideExchangeDialog()
    loadData(user.quotaExchange,{code:this.data.code}).then(async ()=>{
      this.setData({
        code: ''
      })
      app.showNotice('兑换成功')
      await user.reloadInfo()
      this.loadData()
    })
  },

  tapToDetail(e){
    const id = e.currentTarget.dataset.key
    return app.goQuotaDetailPage(id)
  },

  tapToShowExchangeDialog(){
    this.showExchangeDialog()
    // wx.getClipboardData({
    //   success: ({data:code}) => {
    //     this.setData({
    //       code
    //     })
    //   }
    // })
  },

  tapToHideExchangeDialog(){
    if(this.data.code){
      this.setData({
        code: ''
      })
    }
    this.hideExchangeDialog()
  },

  hideExchangeDialog(){
    this.setData({
      showExchangeDialog: false
    })
  },

  showExchangeDialog(){
    this.setData({
      showExchangeDialog: true
    })
  }
})