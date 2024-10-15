import { loadData, showLoading } from '@/utils/index'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
import { CreateEventBehavior } from '@/behaviors/event'

const user = getUserManager()
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['profile','quota']
  },

  inPurchase: false,

  payHideLoading: ()=>{},

  behaviors: [
    CreateEventBehavior('quota')
  ],

  data: {
    list: [] as AnyObject[],
    quota: {
      remain: 0
    },
    iapList: [] as AnyObject[],
    code: ''
  },
  
  onLoad(){
    if(app.isApp){
      wx.miniapp.IAP.addTransactionObserver(app.observers.IapTransactionObserver)
    }
  },

  onReady(){
    this.loadData()
  },

  onUnload(){
    if(app.isApp){
      wx.miniapp.IAP.removeTransactionObserver(app.observers.IapTransactionObserver)
    }
  },

  onEventAppleOrderPayDone(transaction){
    wx.miniapp.IAP.finishTransaction({
      transactionIdentifier: transaction.transactionIdentifier
    })
    if(this.inPurchase){
      console.log('支付成功:', transaction.payment.productIdentifier)
      this.showPayLoading()
      this.inPurchase = false
      loadData(user.updateQuota, transaction, {
        failedContent: '支付异常，请联系客服'
      }).then(()=>{
        this.tapToReloadInfo()
      })
    }
  },

  onEventAppleOrderPayCancel(){
    this.showPayLoading()
  },

  async loadData(){
    if(app.isApp){
      // todo 检查iap购买历史记录，并刷新未完成的订单（服务端）    
    }

    const logs = await loadData(async ()=>{
      await user.reloadInfo()
      return user.getQuotaLog({})
    })
    this.setData({
      'quota.remain': user.quota,
      list: logs.map(e=>{
        e['time'] = new Date(e.createTime).toISOString().split('T')[0]
        return e
      })
    })
  },

  tapToReloadInfo(){
    this.setData({
      'quota.remain': 0,
      list: []
    })
    this.loadData()
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
      this.loadData()
    })
  },

  tapToDetail(e){
    const id = e.currentTarget.dataset.key
    return app.goQuotaDetailPage(id)
  },

  tapToIap(e){
    this.setData({
      showIap: false
    })  
    const iapItemKey = e.currentTarget.dataset.key
    this.inPurchase = false
    this.showPayLoading('获取交易信息')
    const requestObj = wx.miniapp.IAP.requestSKProducts({
      productIdentifiers: [iapItemKey],
      success: (res)=>{
        console.debug('requestSKProducts success',res)
        this.inPurchase = true
        wx.miniapp.IAP.addPaymentByProductIdentifiers({
          productIdentifier: res.products[0].productIdentifier,
          applicationUsername: user.uid,
          quantity: 1,
          success: async (res)=>{
            this.showPayLoading('等待支付')
            console.debug('addPaymentByProductIdentifiers',res)
          },
          fail: console.error,
          complete: ()=>{
            wx.miniapp.IAP.cancelRequestSKProducts(requestObj)
          }
        })
      },
      fail(err){
        console.debug('requestSKProducts err', err)
      }
    })
  },

  async tapToShowExchangeDialog(){
    if(app.isMp || app.isAndroid){
      this.showExchangeDialog()
    }else if(app.isApp){
      const iapList = await loadData(app.getIapItems)
      this.setData({
        iapList,
        showIap: true
      })      
    }
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
  },

  async showPayLoading(msg?:string){
    this.payHideLoading()
    if(msg){
      this.payHideLoading = await showLoading(msg, -1)
    }
  }
})