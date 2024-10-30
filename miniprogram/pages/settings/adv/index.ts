import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings','adv']
  },

  data: {
    showDevItem: false
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {

  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  },

  async tapToCreateToken(){
    await app.showConfirm(this.t('get_token_confirm'))
    const token = await loadData(app.createApiToken)
    const showTokenText = `${token.slice(0,5)}****${token.slice(-5)}`
    const { confirm } = await app.showChoose(`${this.t('new_token')}:\n${showTokenText}`,{
      confirmText: this.t('copy_token')
    })
    if(confirm){
      app.copyText(token)
    }
  },

  tapToShowDevItem(){
    this.setData({
      showDevItem: true
    })
  }
})