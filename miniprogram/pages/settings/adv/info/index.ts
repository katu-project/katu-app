import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings','adv']
  },
  
  data: {
    ccv: {},
    cpk: {}
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {
    this.setData({
      ccv: app.crypto.getCcv(),
      cpk: app.crypto.getCpk()
    })
  }
})