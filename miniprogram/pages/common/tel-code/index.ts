import { getAppManager } from '@/controller/app'
const app = getAppManager()

const codeList = [
  {
    name: '中国',
    key: '+86'
  },
  {
    name: '香港(中国)',
    key: '+852'
  },
  {
    name: '台湾(中国)',
    key: '+886'
  },
  {
    name: '澳门(中国)',
    key: '+853'
  },
  {
    name: '马来西亚',
    key: '+60'
  },
  {
    name: '美国',
    key: '+1'
  },
  {
    name: '加拿大',
    key: '+1'
  },
  {
    name: '新加坡',
    key: '+65'
  },
  {
    name: '澳大利亚',
    key: '+61'
  },
  {
    name: '日本',
    key: '+81'
  }
]

Page({
  where: {},

  originList: codeList,

  data: {
    key: '',
    tag: '',
    list: codeList
  },

  onLoad() {
  },

  onUnload(){
  },

  onReady() {
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
        list: this.data.list.filter(e=>e.key.includes(key))
      })
    }
  },
})