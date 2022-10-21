import { navigateTo, switchTab } from '@/utils/index'
import { APP_ENTRY_PATH } from '@/const'

Component({
  data: {
    selected: 0,
    list:[
      {
        url: `/pages/${APP_ENTRY_PATH}`
      },
      {
        url: '/pages/card/add/index'
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
      const url = this.data.list[tabIdx].url
      if(tabIdx === 1){
        navigateTo(url, true)
      }else{
        this.setData({
          selected: tabIdx
        })
        switchTab(url)
      }
    }
  }
})
