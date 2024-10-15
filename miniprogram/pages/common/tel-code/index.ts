import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['telCode']
  },

  where: {},

  originList: [] as AnyObject[],

  data: {
    key: '',
    tag: '',
    list: [] as AnyObject[]
  },

  onLoad() {
  },

  onUnload(){
  },

  onReady() {
    this.originList = app.getConfig('smsCode').map(e=>({name: this.t(e.name), key: e.key}))
    this.setData({
      list: this.originList
    })
  },

  onShow() {
  },
  
  async tapToChooseCode(e){
    app.publishTelCodeSelectedEvent(e.currentTarget.dataset.key)
    app.navigateBack()
  },

  tapToCloseFilter(){
    this.setData({
      key: ''
    })
    this.resetData()
  },

  resetData(){
    this.setData({
      list: this.originList
    })
  },

  inputSearch(e){
    const key = e.detail.value
    if(!key){
      this.resetData()
    }else{
      this.setData({
        list: this.data.list.filter(e=>e.key.includes(key) || e.name.includes(key))
      })
    }
  },
})