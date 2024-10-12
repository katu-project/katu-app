import { getAppManager } from '@/controller/app'
import { loadData } from '@/utils/index'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['language']
  },
  
  where: {},

  originList: app.SupportedLanguages,

  data: {
    key: '',
    useLang: '',
    list: app.SupportedLanguages
  },

  onLoad() {

  },

  onUnload(){
  },

  onReady() {
  },

  onShow() {
    this.setData({
      useLang: app.UseLanguage
    })
  },
  
  async tapToChooseCode(e){
    await app.showConfirm('确认切换到该语言？')
    app.setUseLanguage(e.currentTarget.dataset.key)
    await loadData(undefined,undefined,'正在切换语言')
    this.setData({
      useLang: app.UseLanguage
    })
    await app.showConfirm('设置需要重新打开应用','立即重启')
    app.reLaunch()
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
        list: this.data.list.filter(e=>this.t(e).includes(key))
      })
    }
  },
})