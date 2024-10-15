import { getAppManager } from '@/controller/app'
const app = getAppManager()

const codeList = [
  {
    name: 'china',
    key: '+86'
  },
  {
    name: 'hong_kong',
    key: '+852'
  },
  {
    name: 'taiwan',
    key: '+886'
  },
  {
    name: 'macau',
    key: '+853'
  },
  {
    name: 'malaysia',
    key: '+60'
  },
  {
    name: 'united_states',
    key: '+1'
  },
  {
    name: 'canada',
    key: '+1'
  },
  {
    name: 'singapore',
    key: '+65'
  },
  {
    name: 'australia',
    key: '+61'
  },
  {
    name: 'japan',
    key: '+81'
  }
]

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
    this.originList = codeList.map(e=>({name: this.t(e.name), key: e.key}))
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