import { navigateTo, switchTab } from '@/utils/index'

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
      const url = this.data.list[tabIdx].url
      if(tabIdx === 1){
        navigateTo(url, true)
      }else{
        this.setData({
          selected: tabIdx
        })
        switchTab(url)
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
