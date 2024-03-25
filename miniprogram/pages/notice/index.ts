import { getAppManager } from '@/controller/app'
import { loadData } from '@/utils/index'
const app = getAppManager()

Page({
  notices: {
    sys: [] as INotice[],
    user: [] as INotice[],
  },
  data: {
    curTab: 'sys',
    list: []
  },

  async onShow(){
    await this.loadData()
    this.setData({
      list: this.notices[this.data.curTab]
    })
  },

  async loadData(){
    this.notices = await loadData(app.getNotices,{})
  },

  onBindRefresh(){
    this.loadData().then(()=>{
      this.setData({
        isRefresh: false,
        list: this.notices[this.data.curTab]
      })
    })
  },

  changeTab(e){
    const tab = e.currentTarget.dataset.tab
    this.setData({
      curTab: tab,
      list: this.notices[tab]
    })
  }
})