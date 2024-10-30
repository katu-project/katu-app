import { getAppManager } from '@/controller/app'
import { loadData } from '@/utils/index'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['language']
  },
  
  where: {},

  originList: app.theme.Languages,

  data: {
    key: '',
    useLang: '',
    list: app.theme.Languages
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
    await app.showConfirm(this.t('use_lang'))
    app.setUseLanguage(e.currentTarget.dataset.key)
    await loadData(undefined,undefined,this.t('switch_lang'))
    this.setData({
      useLang: app.UseLanguage
    })
    await app.showNotice(this.t('reload_work'))
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
        list: this.data.list.filter(e=>this.t(e.name).includes(key))
      })
    }
  },
})