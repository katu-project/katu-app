import { loadData, navigateTo, showSuccess } from '@/utils/index'
import { getUserManager } from '@/class/user'
const user = getUserManager()

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
    loadData(user.quotaExchange,{code:this.data.code}).then(log=>{
      this.setData({
        'quota.remain': log.remainQuota,
        code: ''
      })
      showSuccess('兑换成功')
      wx.nextTick(()=>{
        this.loadData()
        user.loadInfo()
      })
    })
  },
  tapToDetail(e){
    const id = e.currentTarget.dataset.key
    navigateTo(`./detail/index?id=${id}`)
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
  },
  createTestCoupon(){
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'app/createQuotaCoupon',
        data: {
          value: parseInt(this.data.code) || 100
        }
      }
    }).then(({result})=>{
      const code = (result as IAnyObject).data.code
      wx.setClipboardData({
        data: code 
      })
    })
  }
})