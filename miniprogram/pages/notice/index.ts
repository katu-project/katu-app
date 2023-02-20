import { getAppManager } from '@/class/app'
import { loadData } from '@/utils/index'
const app = getAppManager()

Page({
  data: {
    sysList: []
  },
  onShow(){
    this.loadData()
  },
  async loadData(){
    const notices = await loadData(app.getNotices,{})
    notices.sys.map(e=>e.createTime = e.createTime.slice(0,10))
    const setData = {}
    setData['sysList'] = notices.sys
    this.setData(setData)
  },
  tapToDetail({currentTarget:{dataset:{key}}}){
    app.navToDoc(key)
  }
})