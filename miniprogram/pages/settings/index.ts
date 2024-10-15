import { getAppManager } from '@/controller/app'

const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings']
  },

  data: {
    menu: app.menu.settings
  },

  onLoad() {

  },

  onReady() {
    this.data.menu.map((group, idx)=>{
      const hideIdx = group.findIndex(e=>e.devOnly === true)
      if(hideIdx !== -1){
        this.setData({
          [`menu[${idx}][${hideIdx}].hide`]: !app.isDev
        })
      }
    })
  },

  onShow() {

  },

  tapToPage(e){
    const page = e.currentTarget.dataset.page
    app.goToPage(page.startsWith('/') ? page : `settings/${page}/index`)
  }
})