import { getAppManager } from '@/controller/app'
import { switchTab } from '@/utils/index'
const app = getAppManager()

Component({
  data: {
    selected: 0,
    list:[
      {
        url: `/pages/home/index`
      },
      {
        url: '/pages/card/edit/index'
      },
      {
        url: '/pages/profile/index'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const tabIdx = parseInt(e.currentTarget.dataset.idx)
      if(this.data.selected === tabIdx) return
      if(tabIdx === 1){
        app.goCardEditPage('', true)
      }else{
        this.setData({
          selected: tabIdx
        })
        switchTab(this.data.list[tabIdx].url)
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
