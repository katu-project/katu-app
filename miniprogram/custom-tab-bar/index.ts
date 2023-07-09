import { getAppManager } from '@/controller/app'
const app = getAppManager()

Component({
  data: {
    selected: 0
  },
  methods: {
    tapSwitchTab(e) {
      const tabIdx = parseInt(e.currentTarget.dataset.idx)
      if(this.data.selected === tabIdx) return
      if(tabIdx === 1){
        app.goCardEditPage('', true)
      }else{
        this.setData({
          selected: tabIdx
        })
        if(tabIdx == 0){
          app.goToHomePage(true)
        }else{
          app.goToUserProfilePage(true)
        }
      }
    },
    onEventLongPress(){
      wx.setStorage({
        key: 'KATU_DEBUG',
        data: true
      })
    }
  }
})
